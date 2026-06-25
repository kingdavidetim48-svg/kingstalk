import { createTRPCRouter } from "../init";
import { billingRouter } from "./billing";
import { generationsRouter } from "./generations";
import { voicesRouter } from "./voices";
import { manualPaymentsRouter } from "./manual-payments";
import { adminPaymentsRouter } from "./admin-payments";
export const appRouter = createTRPCRouter({
  voices: voicesRouter,
  generations: generationsRouter,
  billing: billingRouter,
  manualPayments: manualPaymentsRouter,
  adminPayments: adminPaymentsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
