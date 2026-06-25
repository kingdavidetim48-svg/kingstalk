"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WavyBackground } from "@/components/ui/wavy-background";
import { Check, ArrowRight, Sparkles, Clock } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planName = searchParams.get("plan") ?? "your";

  const heroColors = ["#2dd4bf", "#22d3ee", "#388df8", "#818cf8"];

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
        <div className="size-20 rounded-full bg-amber-500/15 flex items-center justify-center premium-shadow">
          <div className="size-14 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="size-8 text-amber-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-gradient-hero bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Payment Submitted!
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Thank you for choosing the {planName} plan. Your payment is now
            pending verification. We&apos;ll notify you once it&apos;s approved.
          </p>
        </div>

        <div className="w-full space-y-4 rounded-xl border border-border/50 bg-card/70 p-6 premium-shadow backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-foreground text-left">What happens next?</h3>
          <div className="space-y-4 text-left">
            <div className="flex gap-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</div>
              <div>
                <p className="text-sm font-medium text-foreground">Admin reviews your payment</p>
                <p className="text-xs text-muted-foreground mt-0.5">We verify the transfer and proof of payment</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</div>
              <div>
                <p className="text-sm font-medium text-foreground">Subscription activated</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your plan is enabled and you can start generating</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</div>
              <div>
                <p className="text-sm font-medium text-foreground">Awaiting verification</p>
                <p className="text-xs text-muted-foreground mt-0.5">Check your payment status here for updates</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button size="lg" className="premium-shadow gap-2" onClick={() => router.push("/app/payments")}>
            View Payment Status
            <ArrowRight className="size-4" />
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3" />
            You can check your payment status anytime
          </p>
        </div>
      </div>
    </div>
  );
}
