import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { chatterbox } from "@/lib/chatterbox-client";
import { prisma } from "@/lib/db";
import { getSubscription, checkUsageReset, reserveUsageAtomic, refundUsageAtomic } from "@/lib/subscription";
import { uploadAudio } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { TEXT_MAX_LENGTH } from "@/features/text-to-speech/data/constants";
import { createTRPCRouter, orgProcedure } from "../init";

export const generationsRouter = createTRPCRouter({
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }: any) => {
      const generation = await prisma.generation.findUnique({
        where: { id: input.id, orgId: ctx.orgId },
        omit: {
          orgId: true,
          r2ObjectKey: true,
        },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        ...generation,
        audioUrl: `/api/audio/${generation.id}`,
      };
    }),

  getAll: orgProcedure.query(async ({ ctx }: any) => {
    const generations = await prisma.generation.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
      omit: {
        orgId: true,
        r2ObjectKey: true,
      },
    });

    return generations;
  }),

  create: orgProcedure
    .input(
      z.object({
        text: z.string().min(1).max(TEXT_MAX_LENGTH),
        voiceId: z.string().min(1),
        temperature: z.number().min(0).max(2).default(0.8),
        topP: z.number().min(0).max(1).default(0.95),
        topK: z.number().min(1).max(10000).default(1000),
        repetitionPenalty: z.number().min(1).max(2).default(1.2),
      }),
    )
    .mutation(async ({ input, ctx }: any) => {
      logger.info({ orgId: ctx.orgId, voiceId: input.voiceId }, "Generation request started");

      const subData = await getSubscription(ctx.orgId);
      if (!subData) {
        logger.warn({ orgId: ctx.orgId }, "No subscription found");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "SUBSCRIPTION_REQUIRED",
        });
      }

      const freshSub = await checkUsageReset(subData.subscription);

      // P0-1: Atomically reserve usage BEFORE making external Modal AI GPU call
      const reservation = await reserveUsageAtomic(ctx.orgId, input.text.length, subData.plan);
      if (!reservation.allowed) {
        logger.warn({ orgId: ctx.orgId, reason: reservation.reason }, "Atomic generation reservation rejected");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: reservation.reason!,
        });
      }

      const voice = await prisma.voice.findFirst({
        where: {
          id: input.voiceId,
          OR: [{ variant: "SYSTEM" }, { variant: "CUSTOM", orgId: ctx.orgId }],
        },
        select: {
          id: true,
          name: true,
          variant: true,
          r2ObjectKey: true,
        },
      });

      if (!voice || !voice.r2ObjectKey) {
        await refundUsageAtomic(ctx.orgId, input.text.length);
        logger.warn({ voiceId: input.voiceId, orgId: ctx.orgId }, "Voice not found or missing audio");
        throw new TRPCError({
          code: voice ? "PRECONDITION_FAILED" : "NOT_FOUND",
          message: voice ? "Voice audio not available" : "Voice not found",
        });
      }

      logger.info({ voiceId: voice.id, voiceName: voice.name, variant: voice.variant }, "Voice resolved");

      let data: ArrayBuffer | null = null;
      try {
        const res = await chatterbox.POST("/generate", {
          body: {
            prompt: input.text,
            voice_key: voice.r2ObjectKey,
            temperature: input.temperature,
            top_p: input.topP,
            top_k: input.topK,
            repetition_penalty: input.repetitionPenalty,
            norm_loudness: true,
          },
          parseAs: "arrayBuffer",
        });

        if (res.error || !(res.data instanceof ArrayBuffer)) {
          throw new Error(typeof res.error === "string" ? res.error : "TTS generation failed");
        }
        data = res.data;
      } catch (genError) {
        // P0-1 & P0-6: Refund reserved usage & sanitize error payload
        await refundUsageAtomic(ctx.orgId, input.text.length);
        logger.error(
          { orgId: ctx.orgId, voiceId: voice.id, error: genError instanceof Error ? genError.message : String(genError) },
          "Chatterbox API synthesis failed",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Voice generation failed. Please check parameters and try again.",
        });
      }

      if (!data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Voice generation produced no audio data",
        });
      }

      logger.info({ voiceId: voice.id, byteLength: data.byteLength }, "Audio generated successfully");

      const buffer = Buffer.from(data);
      let generationId: string | null = null;
      let generationR2Key: string | null = null;

      try {
        const generation = await prisma.generation.create({
          data: {
            orgId: ctx.orgId,
            subscriptionId: freshSub.id,
            text: input.text,
            charactersUsed: input.text.length,
            voiceName: voice.name,
            voiceId: voice.id,
            temperature: input.temperature,
            topP: input.topP,
            topK: input.topK,
            repititionPenalty: input.repetitionPenalty,
          },
          select: {
            id: true,
          },
        });

        generationId = generation.id;
        generationR2Key = `generations/orgs/${ctx.orgId}/${generation.id}`;

        await uploadAudio({ buffer, key: generationR2Key });

        await prisma.generation.update({
          where: {
            id: generation.id,
          },
          data: {
            r2ObjectKey: generationR2Key,
          },
        });

        logger.info({ generationId: generation.id }, "Generation record created and audio stored");
      } catch (storeErr) {
        // P0-1: Refund usage if database or storage write fails
        await refundUsageAtomic(ctx.orgId, input.text.length);
        logger.error(
          {
            generationId,
            generationR2Key,
            voiceId: voice.id,
            error: storeErr instanceof Error ? storeErr.message : String(storeErr),
          },
          "Failed to store generated audio",
        );

        if (generationId) {
          await prisma.generation
            .delete({
              where: {
                id: generationId,
              },
            })
            .catch(() => {});
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to store generated audio",
        });
      }

      return {
        id: generationId,
      };
    }),
});

