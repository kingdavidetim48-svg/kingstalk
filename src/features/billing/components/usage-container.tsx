import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTRPC } from "@/trpc/client";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 9,
    desc: "1 custom voice · 3K chars",
  },
  {
    id: "creator",
    name: "Creator",
    price: 19,
    desc: "5 custom voices · 15K chars",
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    desc: "Unlimited voices · 50K chars",
  },
] as const;

function UpgradeCard() {
  const trpc = useTRPC();
  const initMutation = useMutation(
    trpc.billing.initializePaystack.mutationOptions(),
  );

  const handleSelect = (planId: string) => {
    initMutation.mutate(
      { planId },
      {
        onSuccess: (data) => {
          window.location.href = data.authorizationUrl;
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold tracking-tight text-foreground">
        Choose a plan
      </p>
      <p className="text-xs text-muted-foreground">
        Fixed monthly pricing, unlimited generations
      </p>
      <div className="flex flex-col gap-2">
        {PLANS.map((plan) => (
          <Button
            key={plan.id}
            variant="outline"
            className="w-full h-auto min-h-0 whitespace-normal text-xs"
            size="sm"
            disabled={initMutation.isPending}
            onClick={() => handleSelect(plan.id)}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col items-start leading-tight">
                <span className="font-semibold">{plan.name}</span>
                <span className="break-words text-muted-foreground">{plan.desc}</span>
              </div>
              <span className="shrink-0 pt-0.5 font-semibold">${plan.price}/mo</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

function SubscriptionCard({
  plan,
  currentPeriodEnd,
}: {
  plan: { id: string; name: string; maxCustomVoices: number | null; maxGenerationLength: number; premiumVoices: boolean };
  currentPeriodEnd: Date | null;
}) {
  const trpc = useTRPC();
  const initMutation = useMutation(
    trpc.billing.initializePaystack.mutationOptions(),
  );

  const handleChangePlan = () => {
    initMutation.mutate(
      { planId: plan.id },
      {
        onSuccess: (data) => {
          window.location.href = data.authorizationUrl;
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {plan.name} plan
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {plan.maxCustomVoices
            ? `${plan.maxCustomVoices} custom voice${plan.maxCustomVoices !== 1 ? "s" : ""}`
            : "Unlimited custom voices"}
          , max {plan.maxGenerationLength.toLocaleString()} chars per generation
          {plan.premiumVoices ? ", premium voices included" : ""}
        </p>
        {currentPeriodEnd && (
          <p className="text-xs text-muted-foreground mt-1">
            Renews{" "}
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
            }).format(new Date(currentPeriodEnd))}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        className="w-full text-xs"
        size="sm"
        disabled={initMutation.isPending}
        onClick={handleChangePlan}
      >
        {initMutation.isPending ? (
          <>
            <Spinner className="size-3" />
            Redirecting...
          </>
        ) : (
          "Change plan"
        )}
      </Button>
    </div>
  );
}

export function UsageContainer() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.billing.getStatus.queryOptions());

  return (
    <div className="group-data-[collapsible=icon]:hidden bg-background border border-border rounded-lg p-3">
      {data?.hasActiveSubscription && data.plan ? (
        <SubscriptionCard
          plan={data.plan}
          currentPeriodEnd={data.currentPeriodEnd}
        />
      ) : (
        <UpgradeCard />
      )}
    </div>
  );
}
