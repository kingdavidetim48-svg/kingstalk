import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { env } from "./env";

type AdminActor = { userId: string; email: string };

/**
 * Resolves whether a Clerk userId has admin privileges.
 *
 * Authorization strategy (hybrid model):
 *   PRIMARY:  user.publicMetadata.role === "admin"  (database-equivalent, Clerk-managed)
 *   FALLBACK: user's primary email === env.ADMIN_EMAIL (initial bootstrap / single-admin setup)
 *
 * The publicMetadata.role approach survives email changes and supports multiple admins.
 * Set publicMetadata via: Clerk Dashboard → Users → [user] → Metadata → publicMetadata: {"role":"admin"}
 * Or via the Clerk Backend API / SDK as part of an onboarding workflow.
 *
 * IMPORTANT: publicMetadata is server-set only — clients cannot modify it.
 */
async function resolveAdminUser(userId: string): Promise<AdminActor> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  // Primary check: Clerk publicMetadata role (preferred, role-based)
  const isAdminByRole = user.publicMetadata?.role === "admin";

  // Fallback: email match for initial bootstrap (single-admin setups)
  const isAdminByEmail = Boolean(email && email === env.ADMIN_EMAIL);

  if (!isAdminByRole && !isAdminByEmail) {
    throw new Error("FORBIDDEN");
  }

  if (!email) {
    throw new Error("FORBIDDEN");
  }

  return { userId, email };
}

/**
 * Server-side admin guard for API routes and Server Actions.
 * Throws "UNAUTHORIZED" if not authenticated.
 * Throws "FORBIDDEN" if authenticated but not an admin.
 */
export async function requireAdmin(): Promise<AdminActor> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  return resolveAdminUser(userId);
}

/**
 * Server-side admin guard for tRPC procedures.
 * Accepts userId already extracted from the tRPC context.
 * Throws TRPCError UNAUTHORIZED / FORBIDDEN.
 */
export async function requireAdminFromUserId(userId: string): Promise<AdminActor> {
  return resolveAdminUser(userId);
}

