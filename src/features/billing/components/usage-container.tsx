import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTRPC } from "@/trpc/client";
import { Check } from "lucide-react";

function UpgradeCard() {
  const trpc = useTRPC();
  const initMutation = useMutation(
    trpc.billing.initializePaystack.mutationOptions(),
  );
  const { data: plans, isLoading } = useQuery(
    trpc.billing.listPlans.queryOptions(),
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
      <div>
        <p className="text-sm font-semibold tracking-tight text-foreground">
          Choose a plan
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Unlock premium voices & higher limits
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-md bg-muted/40 animate-pulse"
              />
            ))
          : (plans ?? []).map((plan) => {
              const isPopular = plan.id === "creator";
              return (
                <Button
                  key={plan.id}
                  variant={isPopular ? "default" : "outline"}
                  className={`w-full h-auto min-h-0 whitespace-normal text-xs relative${
                    isPopular
                      ? " ring-1 ring-primary/50"
                      : ""
                  }`}
                  size="sm"
                  disabled={initMutation.isPending}
                  onClick={() => handleSelect(plan.id)}
                >
                  {isPopular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold tracking-wider text-primary-foreground uppercase">
                      Popular
                    </span>
                  )}
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col items-start leading-tight">
                      <span className="font-semibold">{plan.name}</span>
                      <span className="break-words text-muted-foreground">
                        {plan.maxCustomVoices
                          ? `${plan.maxCustomVoices} voice${plan.maxCustomVoices !== 1 ? "s" : ""}`
                          : "Unlimited voices"}{" "}
                        · {(plan.monthlyCharacterLimit / 1000).toFixed(0)}K chars/mo
                      </span>
                    </div>
                    <span className="shrink-0 pt-0.5 font-semibold">
                      ${plan.price / 100}/mo
                    </span>
                  </div>
                </Button>
              );
            })}
      </div>
    </div>
  );
}

function SubscriptionCard({
  plan,
  currentPeriodEnd,
}: {
  plan: { id: string; name: string; maxCustomVoices: number | null; perGenerationCharacterLimit: number; monthlyCharacterLimit: number; premiumVoices: boolean; apiAccess: boolean; teamCollaboration: boolean };
  currentPeriodEnd: Date | null;
}) {
  const trpc = useTRPC();
  const { data: plans } = useQuery(trpc.billing.listPlans.queryOptions());
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {plan.name} plan
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {plan.maxCustomVoices
              ? `${plan.maxCustomVoices} custom voice${plan.maxCustomVoices !== 1 ? "s" : ""}`
              : "Unlimited voices"}
            {" · "}
            {(plan.monthlyCharacterLimit / 1000).toFixed(0)}K chars/mo
          </p>
        </div>
        <span className="mt-0.5 flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          <Check size={10} />
          Active
        </span>
      </div>
      {currentPeriodEnd && (
        <p className="text-xs text-muted-foreground">
          Renews{" "}
          {new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
          }).format(new Date(currentPeriodEnd))}
        </p>
      )}

      <div className="border-t border-border pt-2 mt-1">
        {(plans ?? [])
          .filter((p) => p.id !== plan.id)
          .map((p) => (
            <Button
              key={p.id}
              variant="outline"
              className="w-full text-xs mt-1 first:mt-0"
              size="sm"
              disabled={initMutation.isPending}
              onClick={() => handleSelect(p.id)}
            >
              {initMutation.isPending ? (
                <>
                  <Spinner className="size-3" />
                  Redirecting...
                </>
              ) : (
                <>Switch to {p.name} — ${p.price / 100}/mo</>
              )}
            </Button>
          ))}
      </div>
    </div>
  );
}

function UsageProgressCard({
  plan,
  usage,
}: {
  plan: { id: string; name: string; maxCustomVoices: number | null; perGenerationCharacterLimit: number; monthlyCharacterLimit: number; premiumVoices: boolean; apiAccess: boolean; teamCollaboration: boolean };
  usage: { currentUsageCharacters: number; usageResetDate: Date } | null;
}) {
  const charLimit = plan.monthlyCharacterLimit;
  const voiceLimit = plan.maxCustomVoices ?? Infinity;
  const charsUsed = usage?.currentUsageCharacters ?? 0;
  const voicesUsed = 0;
  const charPercent = Math.min(100, Math.round((charsUsed / charLimit) * 100));
  const voicePercent = voiceLimit === Infinity ? 0 : Math.min(100, Math.round((voicesUsed / voiceLimit) * 100));
  const remainingChars = Math.max(0, charLimit - charsUsed);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-tight text-foreground">
          Monthly Usage
        </p>
        {remainingChars > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {remainingChars.toLocaleString()} left
          </span>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Characters</span>
            <span className="text-foreground font-medium">
              {charsUsed.toLocaleString()} / {charLimit.toLocaleString()}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                charPercent >= 90
                  ? "bg-destructive"
                  : charPercent >= 70
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-primary/80 to-primary"
              }`}
              style={{ width: `${charPercent}%` }}
            />
          </div>
        </div>
        {voiceLimit !== Infinity && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Custom Voices</span>
              <span className="text-foreground font-medium">
                {voicesUsed} / {voiceLimit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  voicePercent >= 90
                    ? "bg-destructive"
                    : voicePercent >= 70
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-primary/80 to-primary"
                }`}
                style={{ width: `${voicePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
      {usage?.usageResetDate && (
        <div className="flex items-center gap-1.5 rounded-md bg-accent/30 px-2 py-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500/60" />
          <p className="text-[10px] text-muted-foreground">
            Resets{" "}
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
            }).format(new Date(usage.usageResetDate))}
          </p>
        </div>
      )}
    </div>
  );
}

export function UsageContainer() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.billing.getStatus.queryOptions());

  return (
    <div className="group-data-[collapsible=icon]:hidden flex flex-col gap-3">
      <div className="bg-background border border-border rounded-lg p-3">
        {data?.hasActiveSubscription && data.plan ? (
          <SubscriptionCard
            plan={data.plan}
            currentPeriodEnd={data.currentPeriodEnd}
          />
        ) : (
          <UpgradeCard />
        )}
      </div>
      {data?.hasActiveSubscription && data.plan && (
        <div className="bg-background border border-border rounded-lg p-3">
          <UsageProgressCard plan={data.plan} usage={data.usage} />
        </div>
      )}
    </div>
  );
}
