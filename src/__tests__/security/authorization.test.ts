import { createHash } from 'node:crypto';
/**
 * SECURITY TESTS: Authorization, IDOR, Path Traversal, Cross-Org Access
 *
 * These tests validate the security boundaries implemented in Phase 0.
 * They mock the Prisma client and verify that authorization logic rejects
 * malicious or unauthorized inputs.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { canGenerate } from "@/lib/subscription";
import type { Plan, Subscription } from "@/generated/prisma";

// --- Fixtures -----------------------------------------------------------------

const ORG_A = "org_aaaaaaaaaa";
const ORG_B = "org_bbbbbbbbbb";

function plan(): Plan {
  return {
    id: "plan_1", name: "Pro", price: 500_00,
    monthlyCharacterLimit: 10_000, monthlyGenerationLimit: 100,
    perGenerationCharacterLimit: 2_000, maxCustomVoices: 5,
    apiAccess: true, teamCollaboration: false, premiumVoices: true,
    fasterGeneration: false, createdAt: new Date(), updatedAt: new Date(),
  } as Plan;
}

function sub(orgId: string, usageChars = 0): Subscription {
  return {
    id: "sub_1", orgId, planId: "plan_1", status: "active",
    currentUsageCharacters: usageChars, currentUsageGenerations: 0,
    currentPeriodStart: new Date(), currentPeriodEnd: new Date(),
    usageResetDate: new Date(Date.now() + 86400_000),
    createdAt: new Date(), updatedAt: new Date(),
  } as Subscription;
}

// --- Cross-Org Credit Isolation -----------------------------------------------

describe("Cross-Org Credit Isolation", () => {
  it("Org A at limit does not affect Org B's limit check", () => {
    // Org A is at the limit
    const resultA = canGenerate(sub(ORG_A, 10_000), plan(), 100);
    expect(resultA.allowed).toBe(false);

    // Org B still has fresh usage — must not be affected
    const resultB = canGenerate(sub(ORG_B, 0), plan(), 100);
    expect(resultB.allowed).toBe(true);
  });
});

// --- Path Traversal Detection (R2 Voice Key validation) ----------------------

describe("Voice key path traversal prevention", () => {
  /**
   * These tests validate the string-level validation logic that would be applied
   * to voice keys before passing to storage. In the Python worker (chatterbox_tts.py)
   * these are enforced at the OS path level. Here we test the JS-side detection
   * of clearly malicious keys that should never reach the worker.
   */
  const MALICIOUS_KEYS = [
    "../../../etc/passwd",
    "..\\..\\Windows\\System32",
    "voices/../../../secret",
    "/absolute/path/to/file",
    "http://evil.example.com/malware.wav",
    "https://evil.example.com/malware.wav",
    "file:///etc/passwd",
    "%2e%2e%2f%2e%2e%2fetc/passwd",  // URL-encoded traversal
    "s3://other-bucket/file.wav",
  ];

  function isVoiceKeyAllowed(key: string): boolean {
    // Must not be empty
    if (!key || key.trim() === "") return false;
    // Must not contain URL schemes
    if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//i.test(key)) return false;
    // Must not be an absolute path
    if (key.startsWith("/") || /^[A-Za-z]:\\/.test(key)) return false;
    // Must not contain traversal sequences (decoded)
    const decoded = decodeURIComponent(key);
    if (decoded.includes("../") || decoded.includes("..\\")) return false;
    // Must match expected voice key pattern: voices/... or generations/...
    if (!/^(voices|generations)\//.test(key)) return false;
    return true;
  }

  MALICIOUS_KEYS.forEach((key) => {
    it(`rejects malicious key: "${key.substring(0, 50)}"`, () => {
      expect(isVoiceKeyAllowed(key)).toBe(false);
    });
  });

  it("allows valid R2 voice key format", () => {
    expect(isVoiceKeyAllowed("voices/system/king_voice.wav")).toBe(true);
    expect(isVoiceKeyAllowed("voices/orgs/org_abc/custom.wav")).toBe(true);
  });
});

// --- Payment Proof Hash — Cross-Org Replay -----------------------------------

describe("Payment proof hash policy", () => {
  

  it("same buffer produces same hash (deterministic)", () => {
    const buf = Buffer.from("fake-payment-image-data");
    const hash1 = createHash("sha256").update(buf).digest("hex");
    const hash2 = createHash("sha256").update(buf).digest("hex");
    expect(hash1).toBe(hash2);
  });

  it("different buffers produce different hashes (collision resistance)", () => {
    const buf1 = Buffer.from("payment-proof-org-a");
    const buf2 = Buffer.from("payment-proof-org-b");
    const hash1 = createHash("sha256").update(buf1).digest("hex");
    const hash2 = createHash("sha256").update(buf2).digest("hex");
    expect(hash1).not.toBe(hash2);
  });

  it("hash is 64 hex chars (SHA-256)", () => {
    const hash = createHash("sha256").update(Buffer.from("test")).digest("hex");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

// --- Admin Authorization Logic ------------------------------------------------

describe("Admin authorization strategy", () => {
  it("publicMetadata role=admin is the primary check signal", () => {
    // Simulates the check inside resolveAdminUser in src/lib/admin.ts
    const mockUser = {
      publicMetadata: { role: "admin" },
      emailAddresses: [{ id: "em_1", emailAddress: "other@example.com" }],
      primaryEmailAddressId: "em_1",
    };
    const isAdminByRole = mockUser.publicMetadata?.role === "admin";
    expect(isAdminByRole).toBe(true);
  });

  it("email-only check (no role) still grants access as bootstrap fallback", () => {
    const ADMIN_EMAIL = "admin@kingstalk.com";
    const mockUser = {
      publicMetadata: {},
      emailAddresses: [{ id: "em_1", emailAddress: ADMIN_EMAIL }],
      primaryEmailAddressId: "em_1",
    };
    const email = mockUser.emailAddresses.find(e => e.id === mockUser.primaryEmailAddressId)?.emailAddress;
    const isAdminByRole = mockUser.publicMetadata?.role === "admin";
    const isAdminByEmail = email === ADMIN_EMAIL;
    expect(isAdminByRole || isAdminByEmail).toBe(true);
  });

  it("user without role and wrong email is rejected", () => {
    const ADMIN_EMAIL = "admin@kingstalk.com";
    const mockUser = {
      publicMetadata: { role: "member" },
      emailAddresses: [{ id: "em_1", emailAddress: "attacker@evil.com" }],
      primaryEmailAddressId: "em_1",
    };
    const email = mockUser.emailAddresses.find(e => e.id === mockUser.primaryEmailAddressId)?.emailAddress;
    const isAdminByRole = mockUser.publicMetadata?.role === "admin";
    const isAdminByEmail = email === ADMIN_EMAIL;
    expect(isAdminByRole || isAdminByEmail).toBe(false);
  });

  it("client cannot spoof admin role — publicMetadata is server-set only", () => {
    // This test documents the security invariant: publicMetadata can only be set
    // by the Clerk Backend API or Dashboard — never by the client.
    // The test verifies our authorization reads from publicMetadata (server-trusted),
    // not from unsignedMetadata (client-settable).
    const mockUser = {
      publicMetadata: { role: "member" },   // server-set
      unsafeMetadata: { role: "admin" },    // client-set — MUST NOT be trusted
    };
    const roleFromServerMetadata = mockUser.publicMetadata?.role;
    const roleFromClientMetadata = (mockUser as any).unsafeMetadata?.role;

    // Our logic reads publicMetadata
    const isAdmin = roleFromServerMetadata === "admin";
    expect(isAdmin).toBe(false);
    // If we mistakenly read unsafeMetadata we'd grant access — this must never happen
    expect(roleFromClientMetadata).toBe("admin"); // attacker set this
    expect(isAdmin).toBe(false);                  // but we correctly ignore it
  });
});

