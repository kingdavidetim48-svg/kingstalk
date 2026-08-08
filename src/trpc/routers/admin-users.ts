import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminProcedure, createTRPCRouter, getAdminActor, _t } from "../init";

const MAX_USERS_PAGE = 500;

export const adminUsersRouter = createTRPCRouter({
  getAll: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(MAX_USERS_PAGE).default(200),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async () => {
      const client = await clerkClient();
      const clerkUsers = await client.users.getUserList({ limit: MAX_USERS_PAGE });

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

  block: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        email: z.string().trim().email().toLowerCase(),
        name: z.string().trim().max(200).optional(),
        reason: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await getAdminActor(ctx);

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

  unblock: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const admin = await getAdminActor(ctx);

      const deleted = await prisma.blockedUser.deleteMany({
        where: { userId: input.userId },
      });

      if (deleted.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Blocked user record not found" });
      }

      return { success: true, adminId: admin.userId };
    }),

  isBlocked: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const blocked = await prisma.blockedUser.findUnique({
        where: { userId: input.userId },
      });
      return { isBlocked: !!blocked, reason: blocked?.reason ?? null };
    }),
});

export { _t as t };
