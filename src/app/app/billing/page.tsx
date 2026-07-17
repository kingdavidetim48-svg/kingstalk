"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Sparkles, Flame, Zap, Crown, Star, ArrowRight } from "lucide-react";
import { PaymentMethodSelector } from "@/features/billing/components/payment-method-selector";
import { ManualPaymentForm } from "@/features/billing/components/manual-payment-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Plan styling metadata for premium SaaS presentation
const PLAN_META: Record<
  string,
  {
    tagline: string;
    badge?: string;
    icon: any;
    accentGradient: string;
    borderStyle: string;
    btnClass: string;
    glowClass: string;
  }
> = {
  free: {
    tagline: "Perfect for testing our high-fidelity voice AI.",
    badge: "Free Trial",
    icon: Star,
    accentGradient: "from-slate-500 to-zinc-500",
    borderStyle: "border-border/60 hover:border-slate-300 dark:hover:border-zinc-700 bg-card/50",
    btnClass: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(148,163,184,0.15)]",
  },
  starter: {
    tagline: "Essential features for growing content creators.",
    badge: "Most Popular",
    icon: Flame,
    accentGradient: "from-violet-600 to-indigo-600",
    borderStyle: "border-primary/50 ring-2 ring-primary/10 bg-primary/[0.02]",
    btnClass: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20",
    glowClass: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.25)]",
  },
  creator: {
    tagline: "Scale your reach with advanced customization.",
    badge: "Best Value",
    icon: Zap,
    accentGradient: "from-emerald-500 to-teal-500",
    borderStyle: "border-border/60 hover:border-emerald-300 dark:hover:border-emerald-900 bg-card/50",
    btnClass: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
  },
  pro: {
    tagline: "Powering studios, products, and enterprises.",
    badge: "Enterprise Scale",
    icon: Crown,
    accentGradient: "from-amber-500 to-orange-500",
    borderStyle: "border-border/60 hover:border-amber-300 dark:hover:border-amber-900 bg-card/50",
    btnClass: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
};

type PaymentMethod = "manual";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planIdFromUrl = searchParams.get("planId");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(planIdFromUrl ?? null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("manual");
  const [showSuccess, setShowSuccess] = useState(false);

  const trpc = useTRPC();
  const { data: plans } = useQuery(trpc.billing.listPlans.queryOptions());
  const selectedPlan = plans?.find((p: any) => p.id === selectedPlanId);

  if (showSuccess && selectedPlan) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="size-8 text-emerald-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Payment Submitted</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Your payment for the <strong>{selectedPlan.name}</strong> plan is pending verification.
          Your subscription will activate after admin approval.
        </p>
        <Button onClick={() => router.push("/app/payments")} className="w-full">
          View Payment Status
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="mb-6 text-3xl font-bold">Choose a Plan</h1>

      {/* Plan selector */}
      {!selectedPlanId && (
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {plans?.map((plan: any) => {
            const meta = PLAN_META[plan.id] || PLAN_META.starter;
            const isPopular = plan.id === "starter";
            const Icon = meta.icon;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`group relative flex flex-col rounded-2xl border p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${meta.borderStyle} ${meta.glowClass} flex-1`}
              >
                {/* Top Badge */}
                {meta.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                        isPopular
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                          : "bg-secondary text-secondary-foreground border border-border"
                      }`}
                    >
                      {isPopular && <Flame className="size-3 fill-white" />}
                      {meta.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="text-center pt-2 pb-4">
                  <div className={`mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.accentGradient} text-white shadow-sm`}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px] px-1 line-clamp-2">
                    {meta.tagline}
                  </p>

                  <div className="mt-4 flex items-baseline justify-center">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">
                      NGN {(plan.price / 100).toLocaleString()}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground font-medium">/mo</span>
                  </div>
                </div>

                <hr className="border-t border-border/40 my-1" />

                {/* Features List */}
                <div className="flex-1 py-4 space-y-3.5">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Quota & Limits
                    </p>
                    <div className="flex items-start gap-2 text-xs">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span className="text-foreground/80">{plan.monthlyCharacterLimit.toLocaleString()} characters/mo</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span className="text-foreground/80">
                        {plan.maxCustomVoices === null
                          ? "Unlimited custom voices"
                          : `Up to ${plan.maxCustomVoices} custom voices`}
                      </span>
                    </div>
                  </div>

                  {/* Features Toggle indicators */}
                  {(plan.premiumVoices || plan.fasterGeneration || plan.apiAccess || plan.teamCollaboration) && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Premium Perks
                      </p>
                      {plan.premiumVoices && (
                        <div className="flex items-start gap-2 text-xs">
                          <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                          <span className="text-foreground/80">Premium voices</span>
                        </div>
                      )}
                      {plan.fasterGeneration && (
                        <div className="flex items-start gap-2 text-xs">
                          <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                          <span className="text-foreground/80">Faster generation</span>
                        </div>
                      )}
                      {plan.apiAccess && (
                        <div className="flex items-start gap-2 text-xs">
                          <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                          <span className="text-foreground/80">API access</span>
                        </div>
                      )}
                      {plan.teamCollaboration && (
                        <div className="flex items-start gap-2 text-xs">
                          <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                          <span className="text-foreground/80">Team collaboration</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-4">
                  <Button className={`w-full group-hover:scale-[1.02] transition-transform duration-200 gap-1.5 ${meta.btnClass}`}>
                    Select {plan.name}
                    <ArrowRight className="size-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment flow after plan is selected */}
      {selectedPlanId && selectedPlan && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Subscribe to {selectedPlan.name}
            </h2>
            <p className="text-muted-foreground">
              NGN {(selectedPlan.price / 100).toLocaleString()}/month &middot;{" "}
              {selectedPlan.monthlyCharacterLimit.toLocaleString()} chars/mo
            </p>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => setSelectedPlanId(null)}
            >
              Change plan
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <PaymentMethodSelector selectedMethod={paymentMethod} onMethodChange={setPaymentMethod} />
            </div>
            <div>
              {paymentMethod === "manual" && (
                <ManualPaymentForm planId={selectedPlan.id} onSuccess={() => setShowSuccess(true)} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
