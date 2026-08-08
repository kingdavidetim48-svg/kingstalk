/**
 * PHASE 1: Centralized Authentication & Authorization Context
 *
 * Provides a unified authentication and authorization layer for all tRPC procedures.
 *
 * Context extraction flow:
 * 1. Extract userId from Clerk JWT/session (via createTRPCContext)
 * 2. Extract orgId from session (workspace context)
 * 3. Build user permissions from Clerk publicMetadata
 * 4. Enforce permissions via typed procedure middleware
 */
import "server-only";

import superjson from "superjson";
import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { logger } from "@/lib/logger";

export type TRPCContext = {
  userId: string;
  orgId: string;
  userPermissions: Array<{
    role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
    orgId: string;
  }>;
  requestId: string;
};

/**
 * Creates a unique request ID for correlation tracking across logs.
 */
function createRequestId(): string {
  return typeof crypto !== "undefined"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Centralized context creation with authentication and tenant information.
 * Called ONCE per request via React cache().
 */
export const createTRPCContext = cache(async (): Promise<TRPCContext> => {
  const { userId, orgId, tokenClaims } = await auth();
  const requestId = createRequestId();

  const session = {
    userId: userId ?? "",
    orgId: orgId ?? "",
    requestId,
    role: (tokenClaims?.metadata?.role as string | undefined) ?? "MEMBER",
  };

  const normalizedRole: TRPCContext["userPermissions"][number]["role"] =
    session.role === "admin" ? "ADMIN" : session.role === "super_admin" ? "SUPER_ADMIN" : "MEMBER";

  return {
    userId: session.userId,
    orgId: session.orgId,
    userPermissions: session.orgId
      ? [{ role: normalizedRole, orgId: session.orgId }]
      : [],
    requestId,
  };
});

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const cause = error.cause;
    const sanitized: typeof shape = {
      ...shape,
      data: {
        ...shape.data,
        stack: undefined,
        path: shape.data.path,
        code: shape.data.code,
        httpStatus: shape.data.httpStatus,
      },
    };
    if (cause instanceof Error && cause.message && !sanitized.message) {
      sanitized.message = cause.message;
    }
    return sanitized;
  },
});

/** @internal Re-export for advanced use only (composing custom middleware) */
export const _t = t;

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Public procedure — no authentication, no org.
 * Use sparingly for landing-page data or public lookups.
 */
export const publicProcedure = t.procedure;

/**
 * Authenticated procedure — requires a signed-in user.
 * Does NOT require organization context.
 */
export const authProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    logger.warn({ requestId: ctx.requestId }, "Auth failed: no user ID");
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Please sign in to continue",
    });
  }
  return next();
});

/**
 * Organization-scoped procedure.
 * Requires a signed-in user AND an active organization context.
 * Does NOT check admin role.
 */
export const orgProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    logger.warn({ requestId: ctx.requestId }, "Auth failed: no user ID");
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Please sign in to continue",
    });
  }
  if (!ctx.orgId) {
    logger.warn({ requestId: ctx.requestId, userId: ctx.userId }, "Auth failed: no org context");
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be in an organization to access this resource",
    });
  }
  return next();
});

/**
 * Admin-only procedure.
 * Requires: signed-in user + org context + admin/super_admin role.
 * Role is resolved from:
 *   1. Clerk publicMetadata.role ("admin" / "super_admin")  (PRIMARY)
 *   2. User's primary email matches env.ADMIN_EMAIL         (FALLBACK, bootstrap)
 */
export const adminProcedure = orgProcedure.use(async ({ ctx, next }) => {
  const isAdmin = await resolveIsAdmin(ctx.userId);

  if (!isAdmin) {
    logger.warn(
      { requestId: ctx.requestId, userId: ctx.userId, orgId: ctx.orgId },
      "Admin procedure access denied",
    );
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  const enrichedCtx: typeof ctx = {
    ...ctx,
    userPermissions: [
      {
        role: "ADMIN",
        orgId: ctx.orgId,
      },
    ],
  };

  return next({ ctx: enrichedCtx });
});

/**
 * @internal Admin role resolver shared with tRPC and REST routes.
 */
async function resolveIsAdmin(userId: string): Promise<boolean> {
  try {
    const { clerkClient, env } = await import("@clerk/nextjs/server").then(async (mod) => ({
      clerkClient: (await mod.clerkClient)(),
      env: (await import("@/lib/env")).env,
    }));

    const user = await clerkClient.users.getUser(userId);

    const role = (user.publicMetadata?.role as string | undefined) ?? "";
    if (role === "admin" || role === "super_admin") {
      return true;
    }

    const primaryEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    )?.emailAddress;
    if (primaryEmail && env.ADMIN_EMAIL && primaryEmail.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()) {
      return true;
    }

    return false;
  } catch (err) {
    logger.error(
      { userId, error: err instanceof Error ? err.message : String(err) },
      "Admin role resolution failed",
    );
    return false;
  }
}

/**
 * Build an admin actor (userId + email) for audit logs.
 * Throws if user cannot be resolved.
 */
export async function getAdminActor(
  ctx: Pick<TRPCContext, "userId" | "requestId">,
): Promise<{ userId: string; email: string }> {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(ctx.userId);
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new Error("No email on file");
    }
    return { userId: ctx.userId, email };
  } catch (err) {
    logger.error(
      { requestId: ctx.requestId, userId: ctx.userId, error: err instanceof Error ? err.message : String(err) },
      "Failed to build admin actor",
    );
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to resolve admin identity" });
  }
}

/**
 * Aliases preserved for backward compatibility and external import parity.
 */
export { authProcedure as createAdminProcedure };
