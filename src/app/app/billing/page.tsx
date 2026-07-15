"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { PaymentMethodSelector } from "@/features/billing/components/payment-method-selector";
import { ManualPaymentForm } from "@/features/billing/components/manual-payment-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {plans?.map((plan: any) => (
            <Card
              key={plan.id}
              className="relative flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {plan.id === "starter" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                    <Sparkles className="size-3" />
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className={`text-center ${plan.id === "starter" ? "pt-7" : ""}`}>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    NGN {(plan.price / 100).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm">
                <p>{plan.monthlyCharacterLimit.toLocaleString()} chars/month</p>
                {plan.maxCustomVoices === null
                  ? <p>Unlimited custom voices</p>
                  : <p>Up to {plan.maxCustomVoices} custom voices</p>
                }
                {plan.premiumVoices && <p>Premium voices</p>}
                {plan.fasterGeneration && <p>Faster generation</p>}
                {plan.apiAccess && <p>API access</p>}
                {plan.teamCollaboration && <p>Team collaboration</p>}
              </CardContent>
              <div className="p-4 pt-0">
                <Button className="w-full">Select {plan.name}</Button>
              </div>
            </Card>
          ))}
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
