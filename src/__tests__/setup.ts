// Global test setup — runs before every test file
// Mock server-only modules that crash in test environment
import { vi } from "vitest";

// Stub "server-only" package (Next.js guard — no-op in Vitest)
vi.mock("server-only", () => ({}));

// Prevent accidental real DB calls — tests must mock prisma explicitly
vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: { findUnique: vi.fn(), update: vi.fn() },
    generation: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    voice: { findFirst: vi.fn(), count: vi.fn() },
    paymentSubmission: { findFirst: vi.fn(), create: vi.fn() },
    $executeRaw: vi.fn(),
  },
}));
