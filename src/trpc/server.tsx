/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only"; // <-- ensure this file cannot be imported from the client
import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});


export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
export function prefetch(queryOptions: any) {
  const queryClient = getQueryClient();
  const opts = queryOptions as any;
  const label = Array.isArray(opts.queryKey) ? opts.queryKey[0] : "unknown";
  if (opts.queryKey?.[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(opts).catch((err: any) => {
      console.error(`[prefetch] ${label} failed:`, err);
    });
  } else {
    void queryClient.prefetchQuery(opts).catch((err: any) => {
      console.error(`[prefetch] ${label} failed:`, err);
    });
  }
}
