import "server-only";

/**
 * Clerk webhook signature verification using Webhook from @clerk/nextjs/server.
 * This uses the bundled svix dependency from Clerk's backend package.
 */
export { Webhook } from "svix";
export type { WebhookEvent } from "@clerk/nextjs/server";
