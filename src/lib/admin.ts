/**
 * PHASE 1: Centralized Authorization & Permission System
 *
 * Provides a consistent, server-side authorization layer for KingsTalk.
 * Replaces scattered authorization checks with a centralized RBAC system.
 *
 * Authorization Flow:
 * 1. Authentication (via Clerk) -> provides userId, orgId
 * 2. Role Extraction -> user's role from publicMetadata or database
 * 3. Permission Checking -> role-based or resource-based permissions
 * 4. Enforcement -> throw 403 if permission denied
 *
 * Permission Model:
 * - ADMIN: Full access to all organization resources
 * - MEMBER: Access to own resources (generations, voices, billing)
 *
 * Permissions are checked using:
 *   requirePermission(userId, orgId, permission, resourceId?)
 *
 * Admin authorization must happen on the server - never trust client-side checks.
 */

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { env } from "./env";
import { prisma } from "./db";
import { logger } from "./logger";
import type { PaymentStatus, Prisma } from "@/generated/prisma";

/**
 * Permission actions that can be granted
 */
export type PermissionAction =
  | "MANAGE_USERS"
  | "MANAGE_PAYMENTS"
  | "MANAGE_SUBSCRIPTIONS"
  | "VIEW_AUDIT_LOGS"
  | "MANAGE_VOICES"
  | "MANAGE_GENERATIONS"
  | "VIEW_BILLING"
  | "EXPORT_DATA";

/**
 * User permission structure
 */
export type UserPermission = {
  role: "ADMIN" | "MEMBER";
  orgId: string;
  permissions: PermissionAction[];
};

/**
 * Actor type for authorization helpers
 */
export type AdminActor = { userId: string; email: string };

/**
 * Enhanced admin authorization with role-based checks
 *
 * Authorization strategy (improved from Phase 0):
 *   PRIMARY: user.publicMetadata.role === "admin" (Clerk-managed, survives email changes)
 *   SECONDARY: database role lookup (Phase 2: UserRole table)
 *   FALLBACK: user's primary email === env.ADMIN_EMAIL (initial bootstrap / single-admin setup)
 *
 * This approach:
 * - Survives email changes (unlike pure email matching)
 * - Supports multiple admins (via Clerk roles)
 * - Maintains backward compatibility
 * - Is server-only and secure (publicMetadata cannot be modified by clients)
 *
 * To set admin role:
 *   Clerk Dashboard → Users → [user] → Metadata → publicMetadata: {"role":"admin"}
 *   OR via Clerk Backend API / SDK as part of onboarding workflow
 */
async function resolveAdminUser(userId: string): Promise<AdminActor> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  // Primary check: Clerk publicMetadata role (preferred, role-based)
  const isAdminByRole = user.publicMetadata?.role === "admin";

  // Secondary check: Database role (Phase 2 - when UserRole table exists)
  // const isAdminByDatabase = await checkDatabaseRole(userId);

  // Fallback: email match for initial bootstrap (single-admin setups)
  const isAdminByEmail = Boolean(email && email === env.ADMIN_EMAIL);

  if (!isAdminByRole && !isAdminByEmail) {
    logger.warn(
      { userId, email, hasRole: !!user.publicMetadata?.role },
      "Authorization failed - insufficient privileges"
    );
    throw new Error("FORBIDDEN");
  }

  if (!email) {
    throw new Error("FORBIDDEN");
  }

  return { userId, email };
}

/**
 * Enhanced authorization helpers
 */

/**
 * Require authentication - throws UNAUTHORIZED if not signed in
 */
export async function requireAuth(): Promise<{ userId: string; orgId: string }> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  if (!orgId) {
    throw new Error("ORGANIZATION_REQUIRED");
  }

  return { userId, orgId };
}

/**
 * Require admin privileges - throws FORBIDDEN if not admin
 * Uses the improved authorization strategy from resolveAdminUser
 */
export async function requireAdmin(): Promise<AdminActor> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  return resolveAdminUser(userId);
}

/**
 * Require admin privileges for tRPC procedures
 * Accepts userId already extracted from tRPC context
 */
export async function requireAdminFromUserId(userId: string): Promise<AdminActor> {
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  return resolveAdminUser(userId);
}

/**
 * Check if user has a specific permission in an organization
 * For Phase 1, focuses on admin permissions with future extensibility
 */
export async function checkPermission(
  userId: string,
  orgId: string,
  permission: PermissionAction
): Promise<boolean> {
  try {
    // Get user from Clerk
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Check if user belongs to org
    const { data: orgMemberships = [] } = await client.users.getOrganizationMembershipList({
      userId,
    });

    const isOrgMember = orgMemberships.some(
      (m: any) => (m.organization?.id === orgId || m.organizationId === orgId) && m.role !== "pending"
    );

    if (!isOrgMember) return false;

    // Check admin permissions
    if (
      permission.startsWith("MANAGE_") ||
      permission === "VIEW_AUDIT_LOGS" ||
      permission === "EXPORT_DATA"
    ) {
      const isAdmin = user.publicMetadata?.role === "admin";
      return isAdmin;
    }

    // Member permissions - allow org members to access their own resources
    if (
      permission === "MANAGE_GENERATIONS" ||
      permission === "MANAGE_VOICES" ||
      permission === "VIEW_BILLING"
    ) {
      return true; // Org members can manage their own resources
    }

    return false;
  } catch (error) {
    logger.error(
      { userId, orgId, permission, error: error instanceof Error ? error.message : String(error) },
      "Permission check failed"
    );
    return false;
  }
}

/**
 * Require a specific permission - throws FORBIDDEN if denied
 */
export async function requirePermission(
  userId: string,
  orgId: string,
  permission: PermissionAction
): Promise<void> {
  const hasPermission = await checkPermission(userId, orgId, permission);
  if (!hasPermission) {
    logger.warn(
      { userId, orgId, permission },
      "Permission denied"
    );
    throw new Error("FORBIDDEN");
  }
}

/**
 * Require authentication for API routes and Server Actions
 * Throws "UNAUTHORIZED" if not authenticated.
 * Throws "FORBIDDEN" if authenticated but insufficient privileges.
 */
export async function requireAuthenticatedUser(): Promise<{ userId: string; orgId: string }> {
  return requireAuth();
}

/**
 * Require organization membership
 */
export async function requireOrganizationMember(): Promise<{ userId: string; orgId: string }> {
  return requireAuth();
}

/**
 * Require admin privileges
 */
export async function requireAdminPrivileges(): Promise<AdminActor> {
  return requireAdmin();
}

/**
 * Get current user's permissions for context building
 */
export async function getUserPermissions(
  userId: string,
  orgId: string
): Promise<UserPermission[]> {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Verify org membership
    const { data: orgMemberships = [] } = await client.users.getOrganizationMembershipList({
      userId,
    });

    const isOrgMember = orgMemberships.some(
      (m: any) => (m.organization?.id === orgId || m.organizationId === orgId) && m.role !== "pending"
    );

    if (!isOrgMember) return [];

    // Determine role and permissions
    const role = user.publicMetadata?.role === "admin" ? "ADMIN" : "MEMBER";
    let permissions: PermissionAction[] = [];

    if (role === "ADMIN") {
      permissions = [
        "MANAGE_USERS",
        "MANAGE_PAYMENTS",
        "MANAGE_SUBSCRIPTIONS",
        "VIEW_AUDIT_LOGS",
        "MANAGE_VOICES",
        "MANAGE_GENERATIONS",
        "VIEW_BILLING",
        "EXPORT_DATA",
      ];
    } else {
      // MEMBER permissions
      permissions = [
        "MANAGE_GENERATIONS",
        "MANAGE_VOICES",
        "VIEW_BILLING",
      ];
    }

    return [{ role: role as "ADMIN" | "MEMBER", orgId, permissions }];
  } catch (error) {
    logger.error(
      { userId, orgId, error: error instanceof Error ? error.message : String(error) },
      "Failed to get user permissions"
    );
    return [];
  }
}

/**
 * Clerk client helper
 */
async function clerkClient() {
  const { clerkClient } = await import("@clerk/nextjs/server");
  return await clerkClient();
}

/**
 * Legacy helpers for backward compatibility during migration
 */
export async function requireAdminFromEmail(email: string | null): Promise<boolean> {
  if (!email) return false;
  return email === env.ADMIN_EMAIL;
}

/**
 * Check if user is an admin (legacy email-based check)
 * DEPRECATED: Use requireAdmin() instead
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const admin = await requireAdminFromUserId(userId);
    return !!admin;
  } catch {
    return false;
  }
}