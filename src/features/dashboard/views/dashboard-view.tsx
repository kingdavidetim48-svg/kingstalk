"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { HeroPattern } from "../components/hero-pattern";
import { DashboardHeader } from "../components/dashboard-header";
import { TextInputPanel } from "../components/text-input-panel";
import { QuickActionsPanel } from "../components/quick-actions-panel";

function PaymentVerification({
  reference,
  onComplete,
}: {
  reference: string;
  onComplete: () => void;
}) {
  const trpc = useTRPC();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const verify = useMutation(
    trpc.billing.verifyPaystack.mutationOptions({
      onSuccess: () => {
        setStatus("success");
        toast.success("Payment successful! Your plan is now active.");
        setTimeout(onComplete, 2000);
      },
      onError: (err) => {
        setStatus("error");
        setErrorMsg(err.message);
      },
    }),
  );

  useEffect(() => {
    verify.mutate({ reference });
  }, [reference]);

  if (status === "verifying") {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Spinner className="size-5" />
        <span>Verifying payment...</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-sm text-destructive">Verification failed: {errorMsg}</p>
        <p className="text-xs text-muted-foreground">
          Your payment may still have gone through. Check your Paystack Dashboard.
        </p>
        <Button variant="outline" size="sm" onClick={onComplete}>
          Continue to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-20">
      <div className="size-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-2xl">
        ✓
      </div>
      <p className="text-lg font-semibold text-foreground">Payment Successful!</p>
      <p className="text-sm text-muted-foreground">Your plan is now active.</p>
    </div>
  );
}

export function DashboardView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paystackRef = searchParams.get("reference");

  if (paystackRef) {
    return (
      <PaymentVerification
        reference={paystackRef}
        onComplete={() => router.replace("/app")}
      />
    );
  }

  return (
    <div className="relative min-h-full overflow-x-hidden">
      <PageHeader title="Dashboard" className="lg:hidden" />
      <HeroPattern />
      <div className="relative mx-auto max-w-6xl space-y-10 p-4 pb-16 lg:p-16">
        <DashboardHeader />
        <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <TextInputPanel />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <QuickActionsPanel />
        </div>
      </div>
    </div>
  );
}
