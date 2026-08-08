"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ─── Status display config ────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PAID: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
    title: "Payment Confirmed!",
    description: (planName: string) =>
      `Your ${planName} plan is now active. You can start generating voice content immediately.`,
    cta: "Go to Dashboard",
    ctaHref: "/app",
    color: "emerald",
  },
  PENDING: {
    icon: Clock,
    iconClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    title: "Payment Received",
    description: () =>
      "We received your payment and are confirming it with Flutterwave. This usually takes a few seconds.",
    cta: "Refresh Status",
    ctaHref: null,
    color: "amber",
  },
  FAILED: {
    icon: XCircle,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10",
    title: "Payment Failed",
    description: () =>
      "Your payment could not be verified. You have not been charged. Please try again or contact support.",
    cta: "Try Again",
    ctaHref: "/app/billing",
    color: "red",
  },
  CANCELLED: {
    icon: AlertTriangle,
    iconClass: "text-muted-foreground",
    bgClass: "bg-muted/50",
    title: "Payment Cancelled",
    description: () =>
      "You cancelled the payment. Your subscription has not changed. You can try again whenever you're ready.",
    cta: "View Plans",
    ctaHref: "/app/billing",
    color: "slate",
  },
  NOT_FOUND: {
    icon: AlertTriangle,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10",
    title: "Payment Not Found",
    description: () =>
      "We couldn't find a payment matching this reference. If you completed a payment, please contact support.",
    cta: "Go to Billing",
    ctaHref: "/app/billing",
    color: "red",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

// ─── Main component ───────────────────────────────────────────────────────────

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref");
  const trpc = useTRPC();

  // Poll every 3 seconds while PENDING (up to 30s / 10 polls)
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 10;

  const {
    data: payment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...trpc.billing.getFlwPayment.queryOptions(
      { ref: ref ?? "" },
      {
        enabled: !!ref,
        retry: false,
      },
    ),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!ref) return false;
      if (data?.status === "PAID" || data?.status === "FAILED" || data?.status === "CANCELLED") {
        return false;
      }
      if (pollCount >= maxPolls) return false;
      return 3000;
    },
  });

  // Track poll count to limit retries
  useEffect(() => {
    if (payment?.status === "PENDING") {
      setPollCount((c) => c + 1);
    }
  }, [payment]);

  // Determine UI state
  let statusKey: StatusKey = "PENDING";
  if (!ref) statusKey = "NOT_FOUND";
  else if (isError) statusKey = "NOT_FOUND";
  else if (payment) statusKey = payment.status as StatusKey;

  const config = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING;
  const Icon = config.icon;
  const isPending = statusKey === "PENDING" && !!ref && !isError;
  const isPaid = statusKey === "PAID";

  if (isLoading && ref) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Checking payment status…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Status card */}
        <div className="rounded-2xl border border-border/50 bg-card/70 p-8 text-center premium-shadow">
          {/* Icon */}
          <div className={`mx-auto mb-6 flex size-16 items-center justify-center rounded-full ${config.bgClass}`}>
            {isPending ? (
              <Loader2 className={`size-8 animate-spin ${config.iconClass}`} />
            ) : (
              <Icon className={`size-8 ${config.iconClass}`} />
            )}
          </div>

          {/* Title */}
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            {config.title}
          </h1>

          {/* Description */}
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            {config.description(payment?.planName ?? "Selected")}
          </p>

          {/* Payment details for PAID state */}
          {isPaid && payment && (
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-semibold text-foreground">{payment.planName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-foreground">
                  ${payment.amount.toFixed(2)} {payment.currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs text-muted-foreground">{payment.ref}</span>
              </div>
              {payment.paidAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Confirmed</span>
                  <span className="text-foreground">
                    {new Date(payment.paidAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pending polling hint */}
          {isPending && pollCount < maxPolls && (
            <p className="mb-4 text-xs text-muted-foreground/70">
              Checking automatically… ({pollCount}/{maxPolls})
            </p>
          )}

          {/* CTA button */}
          {config.ctaHref ? (
            <Button
              className="w-full gap-2"
              onClick={() => router.push(config.ctaHref!)}
            >
              {config.cta}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              className="w-full gap-2"
              variant="outline"
              onClick={() => {
                setPollCount(0);
                refetch();
              }}
            >
              <RefreshCw className="size-4" />
              {config.cta}
            </Button>
          )}

          {/* Secondary link for paid */}
          {isPaid && (
            <Button
              variant="link"
              size="sm"
              className="mt-2 h-auto p-0 text-xs text-muted-foreground"
              onClick={() => router.push("/app/payments")}
            >
              View payment history
            </Button>
          )}

          {/* Timeout message */}
          {isPending && pollCount >= maxPolls && (
            <p className="mt-4 text-xs text-muted-foreground">
              Taking longer than expected.{" "}
              <button
                onClick={() => router.push("/app/payments")}
                className="underline hover:text-foreground"
              >
                Check your payment history
              </button>{" "}
              or{" "}
              <button
                onClick={() => { setPollCount(0); refetch(); }}
                className="underline hover:text-foreground"
              >
                retry
              </button>
              .
            </p>
          )}
        </div>

        {/* Security note */}
        <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
          Payment processed securely by Flutterwave · Your subscription is activated automatically
        </p>
      </div>
    </div>
  );
}
