import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { chatterbox } from "@/lib/chatterbox-client";
import { prisma } from "@/lib/db";
import { getSubscription, checkUsageReset, canGenerate, incrementUsage } from "@/lib/subscription";
import { uploadAudio, getSignedAudioUrl } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { TEXT_MAX_LENGTH } from "@/features/text-to-speech/data/constants";
import { createTRPCRouter, orgProcedure } from "../init";

async function getVoiceKey(r2ObjectKey: string): Promise<string> {
  return getSignedAudioUrl(r2ObjectKey);
}

export const generationsRouter = createTRPCRouter({
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
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

  getAll: orgProcedure.query(async ({ ctx }) => {
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
    .mutation(async ({ input, ctx }) => {
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

      const check = canGenerate(freshSub, subData.plan, input.text.length);
      if (!check.allowed) {
        logger.warn({ orgId: ctx.orgId, reason: check.reason }, "Generation limit exceeded");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: check.reason!,
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

      if (!voice) {
        logger.warn({ voiceId: input.voiceId, orgId: ctx.orgId }, "Voice not found or not authorized");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Voice not found",
        });
      }

      logger.info({ voiceId: voice.id, voiceName: voice.name, variant: voice.variant }, "Voice resolved");

      if (!voice.r2ObjectKey) {
        logger.error({ voiceId: voice.id, voiceName: voice.name }, "Voice missing r2ObjectKey");
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Voice audio not available",
        });
      }

      const voiceKey = await getVoiceKey(voice.r2ObjectKey);
      logger.info(
        { r2ObjectKey: voice.r2ObjectKey, voiceKey: voiceKey?.substring(0, 80) + "..." },
        "Generated signed URL for voice sample",
      );

      const { data, error } = await chatterbox.POST("/generate", {
        body: {
          prompt: input.text,
          voice_key: voiceKey,
          temperature: input.temperature,
          top_p: input.topP,
          top_k: input.topK,
          repetition_penalty: input.repetitionPenalty,
          norm_loudness: true,
        },
        parseAs: "arrayBuffer",
      });

      if (error) {
        let errorDetail = "Unknown error";
        try {
          if (error instanceof ArrayBuffer) {
            const decoder = new TextDecoder();
            errorDetail = decoder.decode(error);
          } else if (typeof error === "object") {
            errorDetail = JSON.stringify(error);
          } else {
            errorDetail = String(error);
          }
        } catch {
          errorDetail = "Failed to decode error response";
        }

        logger.error(
          {
            voice_key: voiceKey?.substring(0, 80) + "...",
            r2_object_key: voice.r2ObjectKey,
            voice_name: voice.name,
            voice_id: voice.id,
            errorDetail,
          },
          "Chatterbox API returned an error",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate audio: ${errorDetail}`,
        });
      }

      if (!(data instanceof ArrayBuffer)) {
        logger.error({ voiceId: voice.id }, "Chatterbox returned non-ArrayBuffer response");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid audio response",
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
            repetitionPenalty: input.repetitionPenalty,
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
        logger.error(
          {
            generationId,
            generationR2Key,
            voiceId: voice.id,
            error: storeErr instanceof Error ? storeErr.message : String(storeErr),
            stack: storeErr instanceof Error ? storeErr.stack : undefined,
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
            .catch((delErr) => {
              logger.error(
                { generationId, error: delErr instanceof Error ? delErr.message : String(delErr) },
                "Failed to clean up generation record after storage failure",
              );
            });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to store generated audio",
        });
      }

      if (!generationId || !generationR2Key) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to store generated audio",
        });
      }

      await incrementUsage(ctx.orgId, input.text.length);

      logger.info({ generationId }, "Generation completed successfully");

      return {
        id: generationId,
      };
    }),
});
