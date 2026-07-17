"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Sparkles, Zap, Crown, Flame, ArrowRight, Star, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

interface PlanSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
    cta: string;
    isPremiumHighlighted?: boolean;
  }
> = {
  free: {
    tagline: "Perfect for testing our high-fidelity voice AI.",
    badge: "Free Trial",
    icon: Star,
    accentGradient: "from-slate-500 to-zinc-500",
    borderStyle: "border-border/50 hover:border-slate-300 dark:hover:border-zinc-700 bg-card/40 backdrop-blur-sm",
    btnClass: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/80",
    glowClass: "hover:shadow-[0_0_30px_rgba(148,163,184,0.1)]",
    cta: "Choose Free Trial",
  },
  starter: {
    tagline: "Essential features for growing content creators.",
    badge: "Most Popular",
    icon: Flame,
    accentGradient: "from-violet-600 to-indigo-600",
    borderStyle: "border-violet-500/30 dark:border-violet-500/20 bg-card/60 backdrop-blur-md shadow-xl",
    btnClass: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/10",
    glowClass: "shadow-[0_8px_35px_-6px_rgba(99,102,241,0.15)] hover:shadow-[0_8px_40px_-4px_rgba(99,102,241,0.25)]",
    cta: "Choose Starter",
  },
  creator: {
    tagline: "Scale your reach with advanced customization.",
    badge: "Best Value",
    icon: Zap,
    accentGradient: "from-emerald-500 to-teal-500",
    borderStyle: "border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-500/[0.02] backdrop-blur-md shadow-xl relative",
    btnClass: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/10",
    glowClass: "shadow-[0_8px_40px_-4px_rgba(16,185,129,0.2)] hover:shadow-[0_8px_45px_0_rgba(16,185,129,0.35)] scale-[1.01]",
    cta: "Choose Creator",
    isPremiumHighlighted: true,
  },
  pro: {
    tagline: "Powering studios, products, and enterprises.",
    badge: "Enterprise",
    icon: Crown,
    accentGradient: "from-amber-500 to-orange-500",
    borderStyle: "border-border/50 hover:border-amber-500/30 dark:hover:border-amber-500/20 bg-card/40 backdrop-blur-sm",
    btnClass: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/80",
    glowClass: "hover:shadow-[0_0_35px_rgba(245,158,11,0.12)]",
    cta: "Choose Pro",
  },
};

export function PlanSelectionModal({
  open,
  onOpenChange,
}: PlanSelectionModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: plans } = useQuery(trpc.billing.listAllPlans.queryOptions());

  const selectPlan = useMutation(
    trpc.billing.selectPlan.mutationOptions({
      onSuccess: (data: any) => {
        if (data.activated) {
          toast.success("Free plan activated!");
          queryClient.invalidateQueries({ queryKey: trpc.billing.getStatus.queryKey() });
          onOpenChange(false);
        } else if (data.requiresPayment) {
          router.push(`/app/billing?planId=${data.planId}`);
          onOpenChange(false);
        }
      },
      onError: (error: any) => {
        toast.error(error.message ?? "Failed to select plan");
      },
    }),
  );

  const handleSelect = (planId: "free" | "starter" | "creator" | "pro") => {
    selectPlan.mutate({ planId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-[95vw] max-w-6xl overflow-y-auto p-0 rounded-3xl gap-0 border-border/60 glass-card animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="relative p-5 sm:p-8 md:p-10 mesh-bg-subtle min-h-full flex flex-col justify-between">
          {/* Subtle background glows */}
          <div className="absolute top-0 left-1/4 -z-10 h-80 w-80 rounded-full bg-violet-600/10 blur-[90px] dark:bg-violet-600/5" />
          <div className="absolute bottom-0 right-1/4 -z-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-[90px] dark:bg-emerald-500/5" />

          <div>
            <DialogHeader className="text-center pb-8 max-w-2xl mx-auto">
              <DialogTitle className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground/80 bg-clip-text text-transparent">
                Choose Your Plan
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm sm:text-base mt-2">
                Select a plan to start generating high-quality AI speech and clone voices. Upgrade or downgrade seamlessly as your projects scale.
              </DialogDescription>
            </DialogHeader>

            {/* Plans List Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-2">
              {plans?.map((plan: any) => {
                const meta = PLAN_META[plan.id] || PLAN_META.free;
                const isFree = plan.id === "free";
                const isHighlighted = meta.isPremiumHighlighted;
                const Icon = meta.icon;

                return (
                  <div
                    key={plan.id}
                    className={`group relative flex flex-col justify-between rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1.5 ${meta.borderStyle} ${meta.glowClass}`}
                  >
                    {/* Glowing highlight border for Creator plan */}
                    {isHighlighted && (
                      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 opacity-50 blur-[2px]" />
                    )}

                    {/* Top Badge */}
                    {meta.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                            isHighlighted
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white"
                              : plan.id === "starter"
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-500 text-white"
                                : "bg-background text-foreground border-border/80"
                          }`}
                        >
                          {plan.id === "starter" && <Flame className="size-3 fill-white text-white" />}
                          {plan.id === "creator" && <Zap className="size-3 fill-white text-white" />}
                          {meta.badge}
                        </span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="text-center pt-2">
                      <div className={`mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.accentGradient} text-white shadow-md shadow-black/10`}>
                        <Icon className="size-5" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground/90 mt-1.5 min-h-[34px] px-1 leading-relaxed">
                        {meta.tagline}
                      </p>

                      <div className="mt-5 flex items-baseline justify-center">
                        {isFree ? (
                          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                            Free
                          </span>
                        ) : (
                          <>
                            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                              NGN {(plan.price / 100).toLocaleString()}
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground/80 font-medium">/mo</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border/30 my-5" />

                    {/* Features List */}
                    <div className="flex-1 space-y-4">
                      {/* Character Quota limits */}
                      <div className="space-y-2.5">
                        <FeatureItem
                          text={
                            plan.monthlyGenerationLimit === null
                              ? "Unlimited generation tasks"
                              : `${plan.monthlyGenerationLimit.toLocaleString()} monthly runs`
                          }
                          accentColor={isHighlighted ? "text-emerald-500" : "text-violet-500"}
                        />
                        <FeatureItem
                          text={
                            <>
                              <strong>{plan.monthlyCharacterLimit.toLocaleString()}</strong> characters/mo
                            </>
                          }
                          accentColor={isHighlighted ? "text-emerald-500" : "text-violet-500"}
                        />
                        <FeatureItem
                          text={`${plan.perGenerationCharacterLimit.toLocaleString()} limit per task`}
                          accentColor={isHighlighted ? "text-emerald-500" : "text-violet-500"}
                        />
                        <FeatureItem
                          text={
                            plan.maxCustomVoices === null
                              ? "Unlimited custom voice clones"
                              : plan.maxCustomVoices > 0
                                ? `Up to ${plan.maxCustomVoices} voice clones`
                                : "No custom cloning"
                          }
                          accentColor={isHighlighted ? "text-emerald-500" : "text-violet-500"}
                        />
                      </div>

                      {/* Premium Perks Toggle indicators */}
                      {(plan.premiumVoices || plan.fasterGeneration || plan.apiAccess || plan.teamCollaboration) && (
                        <div className="space-y-2.5 pt-4 border-t border-border/20">
                          <p className="text-[9px] font-extrabold text-muted-foreground/70 uppercase tracking-widest">
                            Premium Perks
                          </p>
                          {plan.premiumVoices && <FeatureItem text="Studio-grade voice engines" accentColor={isHighlighted ? "text-emerald-500" : "text-violet-500"} />}
                          {plan.fasterGeneration && <FeatureItem text="Priority GPU generation" accentColor={isHighlighted ? "text-emerald-500" : "text-violet-500"} />}
                          {plan.apiAccess && <FeatureItem text="Developer REST API access" accentColor={isHighlighted ? "text-emerald-500" : "text-violet-500"} />}
                          {plan.teamCollaboration && <FeatureItem text="Team sharing & Workspaces" accentColor={isHighlighted ? "text-emerald-500" : "text-violet-500"} />}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 pt-2">
                      <Button
                        className={`w-full h-11 rounded-2xl group-hover:scale-[1.01] transition-all duration-200 gap-1.5 font-semibold text-sm ${meta.btnClass}`}
                        disabled={selectPlan.isPending}
                        onClick={() => handleSelect(plan.id as "free" | "starter" | "creator" | "pro")}
                      >
                        {selectPlan.isPending ? (
                          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <>
                            {meta.cta}
                            <ArrowRight className="size-4 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secure Trust Footer info */}
          <div className="mt-8 pt-4 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-muted-foreground/80">
            <span className="flex items-center gap-1.5 font-medium text-foreground/85">
              <ShieldCheck className="size-4 text-emerald-500 fill-emerald-500/10" />
              Secure bank transfer processing &middot; Admin verified
            </span>
            <span>No billing info required for Free Trial. Upgrade, downgrade, or cancel anytime.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureItem({ 
  text, 
  accentColor 
}: { 
  text: React.ReactNode; 
  accentColor?: string 
}) {
  return (
    <div className="flex items-start gap-2.5 text-xs text-foreground/85">
      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${accentColor || 'text-violet-500'}`} />
      <span className="leading-normal">{text}</span>
    </div>
  );
}
