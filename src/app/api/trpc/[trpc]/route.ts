import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "../../../../trpc/init";
import { appRouter } from "../../../../trpc/routers/_app";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const handler = async (req: Request) => {
  const rl = rateLimit(`trpc`, 100, 60_000);

  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: createTRPCContext,
    });
  } catch (error) {
    logger.error({ error }, "tRPC handler error");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export { handler as GET, handler as POST };
