import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminFromUserId } from "@/lib/admin";
import { authProcedure, createTRPCRouter } from "../init";

/** Wraps the centralized requireAdminFromUserId for tRPC context. */
async function requireAdminTRPC(userId: string) {
  try {
    return await requireAdminFromUserId(userId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    throw new TRPCError({
      code: msg === "UNAUTHORIZED" ? "UNAUTHORIZED" : "FORBIDDEN",
      message: "Access denied. Admin only.",
    });
  }
}

export const adminUsersRouter = createTRPCRouter({
  getAll: authProcedure.query(async ({ ctx }: any) => {
    await requireAdminTRPC(ctx.userId);

    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ limit: 200 });

    const blockedUserIds = (
      await prisma.blockedUser.findMany({ select: { userId: true } })
    ).map((b) => b.userId);

    const blockedSet = new Set(blockedUserIds);

    return clerkUsers.data.map((user) => {
      const email =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "N/A";
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        "Unknown";
      return {
        id: user.id,
        name,
        email,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
        isBlocked: blockedSet.has(user.id),
      };
    });
  }),

  block: authProcedure
    .input(
      z.object({
        userId: z.string(),
        email: z.string(),
        name: z.string().optional(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }: any) => {
      const admin = await requireAdminTRPC(ctx.userId);

      await prisma.blockedUser.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          email: input.email,
          name: input.name,
          reason: input.reason,
          blockedBy: admin.userId,
        },
        update: {
          email: input.email,
          name: input.name,
          reason: input.reason,
          blockedBy: admin.userId,
        },
      });

      return { success: true };
    }),

  unblock: authProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      await requireAdminTRPC(ctx.userId);

      await prisma.blockedUser.deleteMany({
        where: { userId: input.userId },
      });

      return { success: true };
    }),

  isBlocked: authProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }: any) => {
      const blocked = await prisma.blockedUser.findUnique({
        where: { userId: input.userId },
      });
      return { isBlocked: !!blocked, reason: blocked?.reason ?? null };
    }),
});
