"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { OnboardingPlanModal } from "./onboarding-plan-modal";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC();
  const [planSelected, setPlanSelected] = useState(false);

  const { data: billingStatus, isLoading } = useQuery(
    trpc.billing.getStatus.queryOptions(),
  );

  const showOnboarding =
    !isLoading &&
    !planSelected &&
    billingStatus &&
    !billingStatus.hasActiveSubscription;

  return (
    <>
      {children}
      <OnboardingPlanModal
        open={!!showOnboarding}
        onPlanSelected={() => setPlanSelected(true)}
      />
    </>
  );
}
