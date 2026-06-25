"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { Check, FileText } from "lucide-react";
import { PaymentHistory } from "./payment-history";

function UpgradeCard() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: plans, isLoading } = useQuery(
    trpc.billing.listPlans.queryOptions(),
  );

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
              <div key={i} className="h-12 rounded-md bg-muted/40 animate-pulse" />
            ))
          : (plans ?? [])
              .filter((p) => p.id !== "free")
              .map((plan) => {
                const isPopular = plan.id === "creator";
                return (
                  <Button
                    key={plan.id}
                    variant={isPopular ? "default" : "outline"}
                    className={`w-full h-auto min-h-0 whitespace-normal text-xs relative${isPopular ? " ring-1 ring-primary/50" : ""}`}
                    size="sm"
                    onClick={() => router.push(`/app/billing?planId=${plan.id}`)}
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
                          · {(plan.perGenerationCharacterLimit / 1000).toFixed(0)}K chars/gen
                        </span>
                      </div>
                      <span className="shrink-0 pt-0.5 font-semibold">${plan.price / 100}/mo</span>
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
  usage,
  currentPeriodEnd,
}: {
  plan: { id: string; name: string; maxCustomVoices: number | null; perGenerationCharacterLimit: number; monthlyCharacterLimit: number; premiumVoices: boolean };
  usage: { currentUsageCharacters: number; usageResetDate: Date } | null;
  currentPeriodEnd: Date | null;
}) {
  const charLimit = plan.monthlyCharacterLimit;
  const charsUsed = usage?.currentUsageCharacters ?? 0;
  const charPercent = Math.min(100, Math.round((charsUsed / charLimit) * 100));
  const remainingChars = Math.max(0, charLimit - charsUsed);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">{plan.name} plan</p>
          <p className="text-xs text-muted-foreground mt-1">
            {(plan.perGenerationCharacterLimit / 1000).toFixed(0)}K chars/gen
          </p>
        </div>
        <span className="mt-0.5 flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          <Check size={10} /> Active
        </span>
      </div>
      {currentPeriodEnd && (
        <p className="text-xs text-muted-foreground">
          Renews {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(currentPeriodEnd))}
        </p>
      )}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <FileText className="size-3" /> Characters
          </span>
          <span className="text-foreground font-medium">
            {charsUsed.toLocaleString()} / {charLimit.toLocaleString()}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-700 ${charPercent >= 90 ? "bg-destructive" : charPercent >= 70 ? "bg-amber-500" : "bg-gradient-to-r from-primary/80 to-primary"}`}
            style={{ width: `${charPercent}%` }}
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">{remainingChars.toLocaleString()} characters remaining</p>
      {usage?.usageResetDate && (
        <div className="flex items-center gap-1.5 rounded-md bg-accent/30 px-2 py-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500/60" />
          <p className="text-[10px] text-muted-foreground">
            Resets {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(usage.usageResetDate))}
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
          <SubscriptionCard plan={data.plan} usage={data.usage} currentPeriodEnd={data.currentPeriodEnd} />
        ) : (
          <UpgradeCard />
        )}
      </div>
      <PaymentHistory />
    </div>
  );
}
