"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Check, Clock, XCircle, ArrowRight, CreditCard } from "lucide-react";

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    label: "Pending Verification",
  },
  APPROVED: {
    icon: Check,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    label: "Approved",
  },
  REJECTED: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Rejected",
  },
};

export default function PaymentsPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: status } = useQuery(trpc.billing.getStatus.queryOptions());
  const { data: submissions, isLoading } = useQuery(trpc.billing.getMySubmissions.queryOptions());

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Payments</h1>

      {/* Current subscription status */}
      {status?.hasActiveSubscription && status.plan && (
        <div className="rounded-xl border border-border/50 bg-card/70 p-5 premium-shadow mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{status.plan.name} Plan</p>
              <p className="text-xs text-muted-foreground mt-1">
                {status.plan.monthlyCharacterLimit.toLocaleString()} chars/month
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <Check className="size-3" /> Active
            </span>
          </div>
          {status.usage && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Characters used</span>
                <span className="text-foreground">
                  {status.usage.currentUsageCharacters.toLocaleString()} / {status.plan.monthlyCharacterLimit.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all"
                  style={{ width: `${Math.min(100, Math.round((status.usage.currentUsageCharacters / status.plan.monthlyCharacterLimit) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Submission History</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="size-5" />
          </div>
        ) : submissions && submissions.length > 0 ? (
          submissions.map((sub) => {
            const cfg = statusConfig[sub.status as keyof typeof statusConfig] ?? statusConfig.PENDING;
            const Icon = cfg.icon;
            return (
              <div key={sub.id} className="rounded-xl border border-border/50 bg-card/70 p-4 premium-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex size-8 items-center justify-center rounded-full ${cfg.bg}`}>
                      <Icon className={`size-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{sub.planName} Plan</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ${(sub.amount / 100).toFixed(2)} · {sub.transferReference}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      {sub.adminNote && sub.status === "REJECTED" && (
                        <p className="text-xs text-destructive mt-1">Reason: {sub.adminNote}</p>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/70 p-8 text-center premium-shadow">
            <CreditCard className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No payment submissions yet</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/app/billing?planId=starter")}>
              Subscribe to a Plan <ArrowRight className="ml-1 size-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
