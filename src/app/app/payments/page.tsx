"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Zap,
} from "lucide-react";

// ─── Status display config ────────────────────────────────────────────────────

const FLW_STATUS_CONFIG = {
  PAID: {
    icon: Check,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    label: "Paid",
  },
  PENDING: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    label: "Pending",
  },
  FAILED: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Failed",
  },
  CANCELLED: {
    icon: AlertTriangle,
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    label: "Cancelled",
  },
} as const;

type FlwStatus = keyof typeof FLW_STATUS_CONFIG;

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: status } = useQuery(trpc.billing.getStatus.queryOptions());
  const { data: payments, isLoading } = useQuery(
    trpc.billing.getMyFlwPayments.queryOptions(),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Payments</h1>

      {/* Current subscription status card */}
      {status?.hasActiveSubscription && status.plan && (
        <div className="rounded-xl border border-border/50 bg-card/70 p-5 premium-shadow mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {status.plan.name} Plan
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {status.plan.monthlyCharacterLimit.toLocaleString()} characters/month
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 shrink-0">
              <Check className="size-3" />
              Active
            </span>
          </div>

          {/* Usage bar */}
          {status.usage && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Characters used</span>
                <span className="text-foreground tabular-nums">
                  {status.usage.currentUsageCharacters.toLocaleString()} /{" "}
                  {status.plan.monthlyCharacterLimit.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (status.usage.currentUsageCharacters /
                          status.plan.monthlyCharacterLimit) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Period info */}
          {status.currentPeriodEnd && (
            <p className="mt-3 text-[11px] text-muted-foreground/70">
              Renews{" "}
              {new Date(status.currentPeriodEnd).toLocaleDateString("en-US", {
                dateStyle: "medium",
              })}
            </p>
          )}

          {/* Upgrade button */}
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/app/billing")}
              className="gap-1.5"
            >
              <Zap className="size-3.5" />
              Upgrade Plan
            </Button>
          </div>
        </div>
      )}

      {/* No active subscription CTA */}
      {!status?.hasActiveSubscription && !isLoading && (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 mb-6 text-center">
          <CreditCard className="mx-auto size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No active plan</p>
          <p className="text-xs text-muted-foreground mb-4">
            Subscribe to unlock full voice generation features.
          </p>
          <Button
            size="sm"
            onClick={() => router.push("/app/billing")}
            className="gap-1.5"
          >
            View Plans
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Payment history */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Payment History
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="size-5" />
          </div>
        ) : payments && payments.length > 0 ? (
          payments.map((p) => {
            const cfg =
              FLW_STATUS_CONFIG[p.status as FlwStatus] ??
              FLW_STATUS_CONFIG.PENDING;
            const Icon = cfg.icon;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-border/50 bg-card/70 p-4 premium-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}
                    >
                      <Icon className={`size-4 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {p.planName} Plan
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatUsd(p.amount)} · {p.currency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5 truncate">
                        {p.ref}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* Link to success page for pending payments */}
                {p.status === "PENDING" && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5 text-muted-foreground"
                      onClick={() =>
                        router.push(`/app/payments/success?ref=${p.ref}`)
                      }
                    >
                      <Clock className="size-3" />
                      Check payment status
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/70 p-8 text-center premium-shadow">
            <CreditCard className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No payments yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/app/billing")}
              className="gap-1.5"
            >
              Subscribe to a Plan
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
