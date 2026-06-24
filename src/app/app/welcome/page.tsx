"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { WavyBackground } from "@/components/ui/wavy-background";
import { Check, ArrowRight, Sparkles, Zap, Mic, FileText, Infinity } from "lucide-react";

type PlanInfo = {
  id: string;
  name: string;
  maxCustomVoices: number | null;
  perGenerationCharacterLimit: number;
  monthlyCharacterLimit: number;
  premiumVoices: boolean;
  apiAccess: boolean;
  teamCollaboration: boolean;
};

export default function WelcomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();
  const reference = searchParams.get("reference");
  const planId = searchParams.get("plan");
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    reference ? "verifying" : "success",
  );
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const verify = useMutation(
    trpc.billing.verifyPaystack.mutationOptions({
      onSuccess: (data) => {
        setStatus("success");
        if (data.plan) setPlan(data.plan);
      },
      onError: (err) => {
        setStatus("error");
        setErrorMsg(err.message);
      },
    }),
  );

  useEffect(() => {
    if (reference) {
      verify.mutate({ reference });
    }
  }, [reference]);

  const heroColors = ["#2dd4bf", "#22d3ee", "#388df8", "#818cf8"];

  if (status === "verifying") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 mesh-bg opacity-30" />
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/70 px-8 py-6 premium-shadow backdrop-blur-xl">
          <Spinner className="size-6 text-primary" />
          <span className="text-sm text-muted-foreground">Verifying your payment...</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-background px-4">
        <div className="pointer-events-none absolute inset-0 mesh-bg opacity-20" />
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border/50 bg-card/70 px-8 py-10 premium-shadow backdrop-blur-xl max-w-md text-center">
          <div className="size-14 rounded-full bg-destructive/15 flex items-center justify-center">
            <span className="text-destructive text-2xl font-bold">!</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Verification failed</h2>
            <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Your payment may still have gone through. Check your Paystack Dashboard or contact support.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push("/app")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const displayName = plan?.name ?? (planId ? planId.charAt(0).toUpperCase() + planId.slice(1) : "your");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-30" />
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <WavyBackground
          colors={heroColors}
          backgroundFill="transparent"
          blur={6}
          speed="slow"
          waveOpacity={0.08}
          waveWidth={60}
          waveYOffset={300}
          containerClassName="h-full"
          className="hidden"
        />
      </div>

      <div className="animate-fade-in-up relative mx-auto flex max-w-lg flex-col items-center gap-8 text-center">
        {/* Success icon */}
        <div className="stagger-1 size-20 rounded-full bg-emerald-500/15 flex items-center justify-center premium-shadow">
          <div className="size-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="size-8 text-emerald-400" />
          </div>
        </div>

        {/* Title */}
        <div className="stagger-2 space-y-2">
          <h1 className="text-gradient-hero bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Welcome to {displayName}!
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your subscription is active and you&apos;re all set to create stunning AI voiceovers.
          </p>
        </div>

        {/* Plan card */}
        {plan && (
          <div className="stagger-3 w-full rounded-xl border border-border/50 bg-card/70 p-6 premium-shadow backdrop-blur-xl text-left space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{plan.name} Plan</span>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                <Check size={10} />
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 rounded-lg bg-accent/30 p-3">
                <FileText className="size-4 text-primary/70" />
                <p className="text-xs text-muted-foreground">Monthly characters</p>
                <p className="text-lg font-bold text-foreground">{plan.monthlyCharacterLimit.toLocaleString()}</p>
              </div>
              <div className="space-y-1 rounded-lg bg-accent/30 p-3">
                <Mic className="size-4 text-primary/70" />
                <p className="text-xs text-muted-foreground">Custom voices</p>
                <p className="text-lg font-bold text-foreground">
                  {plan.maxCustomVoices ? `${plan.maxCustomVoices}` : <Infinity className="size-5 inline" />}
                </p>
              </div>
              <div className="space-y-1 rounded-lg bg-accent/30 p-3">
                <p className="text-xs text-muted-foreground">Per generation</p>
                <p className="text-lg font-bold text-foreground">{(plan.perGenerationCharacterLimit / 1000).toFixed(0)}K chars</p>
              </div>
              <div className="space-y-1 rounded-lg bg-accent/30 p-3">
                <p className="text-xs text-muted-foreground">Premium voices</p>
                <p className="text-lg font-bold text-foreground">{plan.premiumVoices ? "Included" : "Not included"}</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="stagger-4 flex flex-col items-center gap-4">
          <Button size="lg" className="premium-shadow gap-2" onClick={() => router.push("/app")}>
            Go to Dashboard
            <ArrowRight className="size-4" />
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3" />
            Start typing text or upload a script to generate your first voiceover
          </p>
        </div>
      </div>
    </div>
  );
}
