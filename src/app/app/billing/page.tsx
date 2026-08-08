"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  Flame,
  Zap,
  Crown,
  Star,
  ArrowRight,
  ShieldCheck,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Server-side plan pricing (mirrored from src/lib/flutterwave.ts FLW_PLANS) ─
// These are DISPLAY values only. The backend validates actual price.
const PLAN_USD_PRICES: Record<string, number> = {
  starter: 10,
  creator: 25,
  pro: 50,
};

// ─── Plan visual metadata ───────────────────────────────────────────────────

const PLAN_META: Record<
  string,
  {
    tagline: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
    accentGradient: string;
    borderStyle: string;
    btnClass: string;
    glowClass: string;
    isHighlighted?: boolean;
  }
> = {
  starter: {
    tagline: "Essential features for growing content creators.",
    badge: "Most Popular",
    icon: Flame,
    accentGradient: "from-violet-600 to-indigo-600",
    borderStyle:
      "border-violet-500/30 dark:border-violet-500/20 bg-card/60 backdrop-blur-md shadow-xl",
    btnClass:
      "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/10",
    glowClass:
      "shadow-[0_8px_35px_-6px_rgba(99,102,241,0.15)] hover:shadow-[0_8px_40px_-4px_rgba(99,102,241,0.25)]",
  },
  creator: {
    tagline: "Scale your reach with advanced customization.",
    badge: "Best Value",
    icon: Zap,
    accentGradient: "from-emerald-500 to-teal-500",
    borderStyle:
      "border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-500/[0.02] backdrop-blur-md shadow-xl",
    btnClass:
      "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/10",
    glowClass:
      "shadow-[0_8px_40px_-4px_rgba(16,185,129,0.2)] hover:shadow-[0_8px_45px_0_rgba(16,185,129,0.35)] scale-[1.01]",
    isHighlighted: true,
  },
  pro: {
    tagline: "Powering studios, products, and enterprises.",
    badge: "Enterprise",
    icon: Crown,
    accentGradient: "from-amber-500 to-orange-500",
    borderStyle:
      "border-border/60 hover:border-amber-300 dark:hover:border-amber-900 bg-card/50",
    btnClass: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  free: {
    tagline: "Perfect for testing our high-fidelity voice AI.",
    badge: "Free Trial",
    icon: Star,
    accentGradient: "from-slate-500 to-zinc-500",
    borderStyle:
      "border-border/60 hover:border-slate-300 dark:hover:border-zinc-700 bg-card/50",
    btnClass: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(148,163,184,0.15)]",
  },
};

// ─── Payment button states ──────────────────────────────────────────────────

type CheckoutState = "idle" | "preparing" | "redirecting" | "error";

// ─── Main component ─────────────────────────────────────────────────────────

export default function BillingPage() {
  const router = useRouter();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const trpc = useTRPC();
  const { data: plans, isLoading: plansLoading } = useQuery(
    trpc.billing.listPlans.queryOptions(),
  );
  const { data: status } = useQuery(trpc.billing.getStatus.queryOptions());

  const startCheckout = async (planId: string) => {
    if (checkoutState !== "idle") return;

    setCheckoutPlanId(planId);
    setCheckoutState("preparing");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();

      if (!res.ok || !data.paymentLink) {
        throw new Error(data.error ?? "Failed to initialize payment");
      }

      setCheckoutState("redirecting");
      // Small UX delay so user sees "Redirecting…" message
      await new Promise((r) => setTimeout(r, 400));
      window.location.href = data.paymentLink;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "We couldn't start your payment.";
      setErrorMsg(msg);
      setCheckoutState("error");
      toast.error("Payment initialization failed", {
        description: "Please try again in a moment.",
      });
    }
  };

  const resetCheckout = () => {
    setCheckoutState("idle");
    setCheckoutPlanId(null);
    setErrorMsg(null);
  };

  const isCheckingOut = checkoutState === "preparing" || checkoutState === "redirecting";

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Choose a Plan
          </h1>
          <p className="text-sm text-muted-foreground">
            Billed monthly in USD · Secure checkout by Flutterwave
          </p>
        </div>

        {/* Active subscription banner */}
        {status?.hasActiveSubscription && status.plan && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-sm">
            <Check className="size-4 text-emerald-500 shrink-0" />
            <span className="text-foreground">
              You&apos;re currently on the{" "}
              <strong>{status.plan.name}</strong> plan.{" "}
              <span className="text-muted-foreground">
                Selecting a new plan will upgrade or change your subscription.
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Plans grid */}
      {plansLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan: any) => {
            const meta = PLAN_META[plan.id] ?? PLAN_META.starter;
            const usdPrice = PLAN_USD_PRICES[plan.id];
            const Icon = meta.icon;
            const isThisPlan = checkoutPlanId === plan.id;
            const isCurrentPlan = status?.plan?.id === plan.id;

            return (
              <div
                key={plan.id}
                className={`group relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${meta.borderStyle} ${meta.glowClass}`}
              >
                {/* Highlight background for Creator */}
                {meta.isHighlighted && (
                  <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-emerald-500/8 to-teal-500/4 opacity-60" />
                )}

                {/* Badge */}
                {meta.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                        meta.isHighlighted
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white"
                          : plan.id === "starter"
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-500 text-white"
                            : "bg-background text-foreground border-border/80"
                      }`}
                    >
                      {plan.id === "starter" && <Flame className="size-3 fill-white text-white" />}
                      {meta.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="text-center pt-2 pb-4">
                  <div
                    className={`mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.accentGradient} text-white shadow-sm`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px] px-1 line-clamp-2">
                    {meta.tagline}
                  </p>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline justify-center gap-0.5">
                    <span className="text-sm font-medium text-muted-foreground">$</span>
                    <span className="text-4xl font-extrabold tracking-tight text-foreground">
                      {usdPrice ?? "—"}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground font-medium">/mo</span>
                  </div>
                </div>

                <hr className="border-t border-border/40 my-1" />

                {/* Features */}
                <div className="flex-1 py-4 space-y-3">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Quota &amp; Limits
                    </p>
                    <FeatureRow
                      text={`${plan.monthlyCharacterLimit.toLocaleString()} characters/mo`}
                      highlighted={meta.isHighlighted}
                    />
                    <FeatureRow
                      text={
                        plan.maxCustomVoices === null
                          ? "Unlimited custom voices"
                          : `Up to ${plan.maxCustomVoices} custom voices`
                      }
                      highlighted={meta.isHighlighted}
                    />
                    {plan.monthlyGenerationLimit !== null && (
                      <FeatureRow
                        text={`${plan.monthlyGenerationLimit.toLocaleString()} monthly runs`}
                        highlighted={meta.isHighlighted}
                      />
                    )}
                  </div>

                  {(plan.premiumVoices || plan.fasterGeneration || plan.apiAccess || plan.teamCollaboration) && (
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Premium Perks
                      </p>
                      {plan.premiumVoices && <FeatureRow text="Studio-grade voice engines" highlighted={meta.isHighlighted} />}
                      {plan.fasterGeneration && <FeatureRow text="Priority GPU generation" highlighted={meta.isHighlighted} />}
                      {plan.apiAccess && <FeatureRow text="Developer REST API" highlighted={meta.isHighlighted} />}
                      {plan.teamCollaboration && <FeatureRow text="Team sharing & workspaces" highlighted={meta.isHighlighted} />}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <div className="mt-4">
                  {isCurrentPlan ? (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <Check className="size-3.5" />
                      Current Plan
                    </div>
                  ) : (
                    <Button
                      id={`checkout-${plan.id}`}
                      className={`w-full gap-1.5 transition-all duration-200 ${meta.btnClass}`}
                      disabled={isCheckingOut}
                      onClick={() => startCheckout(plan.id)}
                    >
                      {isThisPlan && checkoutState === "preparing" && (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Preparing checkout…
                        </>
                      )}
                      {isThisPlan && checkoutState === "redirecting" && (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Redirecting…
                        </>
                      )}
                      {(!isThisPlan || checkoutState === "idle" || checkoutState === "error") && (
                        <>
                          Get {plan.name}
                          <ArrowRight className="size-4 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error state */}
      {checkoutState === "error" && errorMsg && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              Couldn&apos;t start your payment
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{errorMsg}</p>
          </div>
          <Button variant="outline" size="sm" onClick={resetCheckout} className="shrink-0">
            Try Again
          </Button>
        </div>
      )}

      {/* Trust footer */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/30 pt-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Lock className="size-3.5" />
          Payments processed securely by Flutterwave
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          No bank transfers or receipt uploads required
        </span>
      </div>
    </div>
  );
}

function FeatureRow({
  text,
  highlighted,
}: {
  text: string;
  highlighted?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <Check
        className={`h-4 w-4 shrink-0 mt-0.5 ${
          highlighted ? "text-emerald-500" : "text-violet-500"
        }`}
      />
      <span className="text-foreground/80">{text}</span>
    </div>
  );
}
