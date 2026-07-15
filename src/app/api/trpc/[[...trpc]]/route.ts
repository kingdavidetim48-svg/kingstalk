import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "../../../../trpc/init";
import { appRouter } from "../../../../trpc/routers/_app";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const handler = async (req: Request) => {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`trpc:${clientIp}`, 100, 60_000);

  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const procedurePath = url.searchParams.get("batch") ? "batch" : url.pathname.replace("/api/trpc/", "");

  try {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: createTRPCContext,
      onError: ({ error, path, type }: any) => {
        logger.error(
          { error: error.message, code: error.code, path, type },
          `tRPC error`,
        );
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: message, path: procedurePath }, "tRPC handler error");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export { handler as GET, handler as POST };
