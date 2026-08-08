/**
 * PHASE 1: Centralized Role-Based Access Control (RBAC) & Permissions
 *
 * Defines application roles, permission actions, and permission enforcement logic.
 */

import "server-only";

export type Role = "SUPER_ADMIN" | "ADMIN" | "MEMBER";

export type PermissionAction =
  | "MANAGE_USERS"
  | "MANAGE_PAYMENTS"
  | "MANAGE_SUBSCRIPTIONS"
  | "VIEW_AUDIT_LOGS"
  | "MANAGE_VOICES"
  | "MANAGE_GENERATIONS"
  | "VIEW_BILLING"
  | "EXPORT_DATA";

export interface UserPermission {
  role: "admin" | "member" | "super_admin";
  orgId: string;
}

export const ROLE_PERMISSIONS: Record<Role, PermissionAction[]> = {
  SUPER_ADMIN: [
    "MANAGE_USERS",
    "MANAGE_PAYMENTS",
    "MANAGE_SUBSCRIPTIONS",
    "VIEW_AUDIT_LOGS",
    "MANAGE_VOICES",
    "MANAGE_GENERATIONS",
    "VIEW_BILLING",
    "EXPORT_DATA",
  ],
  ADMIN: [
    "MANAGE_USERS",
    "MANAGE_PAYMENTS",
    "MANAGE_SUBSCRIPTIONS",
    "VIEW_AUDIT_LOGS",
    "MANAGE_VOICES",
    "MANAGE_GENERATIONS",
    "VIEW_BILLING",
    "EXPORT_DATA",
  ],
  MEMBER: [
    "MANAGE_VOICES",
    "MANAGE_GENERATIONS",
    "VIEW_BILLING",
  ],
};

/**
 * Check if a given role has a specific permission action
 */
export function hasRolePermission(role: Role, action: PermissionAction): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(action) : false;
}
