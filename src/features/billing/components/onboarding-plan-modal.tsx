"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";

interface OnboardingPlanModalProps {
  open: boolean;
  onPlanSelected: () => void;
}

export function OnboardingPlanModal({
  open,
  onPlanSelected,
}: OnboardingPlanModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: plans } = useQuery(trpc.billing.listAllPlans.queryOptions());

  const selectPlan = useMutation(
    trpc.billing.selectPlan.mutationOptions({
      onSuccess: (data: any) => {
        if (data.activated) {
          toast.success("Free plan activated! You're all set.");
          queryClient.invalidateQueries({
            queryKey: trpc.billing.getStatus.queryKey(),
          });
        } else if (data.requiresPayment) {
          router.push(`/app/billing?planId=${data.planId}`);
        }
        onPlanSelected();
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
    <Dialog
      open={open}
      onOpenChange={() => {
        // Intentionally block all dismiss attempts.
        // The user MUST select a plan before proceeding.
      }}
    >
      <DialogContent
        className="sm:max-w-4xl"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl">
              Welcome! Choose your plan
            </DialogTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Pick a plan to start using KingsTalk. You can upgrade or change
              anytime.
            </p>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-4 mt-6">
            {plans?.map((plan: any) => {
              const isFree = plan.id === "free";
              const isPopular = plan.id === "starter";
              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col transition-all duration-300 hover:shadow-md ${
                    isPopular ? "border-primary/50 ring-1 ring-primary/20" : ""
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                        <Sparkles className="size-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <CardHeader
                    className={`text-center ${isPopular ? "pt-7" : ""}`}
                  >
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      {isFree ? (
                        <span className="text-3xl font-bold text-foreground">
                          Free
                        </span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-foreground">
                            NGN {(plan.price / 100).toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">/month</span>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <FeatureRow
                      text={
                        plan.monthlyGenerationLimit === null
                          ? "Unlimited generations"
                          : `${plan.monthlyGenerationLimit} generations/month`
                      }
                    />
                    <FeatureRow
                      text={`${plan.monthlyCharacterLimit.toLocaleString()} chars/month`}
                    />
                    <FeatureRow
                      text={`Up to ${plan.perGenerationCharacterLimit.toLocaleString()} chars per generation`}
                    />
                    <FeatureRow
                      text={
                        plan.maxCustomVoices === null
                          ? "Unlimited custom voices"
                          : plan.maxCustomVoices > 0
                            ? `Up to ${plan.maxCustomVoices} custom voice${plan.maxCustomVoices !== 1 ? "s" : ""}`
                            : "No custom voices"
                      }
                    />
                    {plan.premiumVoices && <FeatureRow text="Premium voices" />}
                    {plan.fasterGeneration && (
                      <FeatureRow text="Faster generation speed" />
                    )}
                    {plan.apiAccess && <FeatureRow text="API access" />}
                    {plan.teamCollaboration && (
                      <FeatureRow text="Team collaboration" />
                    )}
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isFree ? "outline" : "default"}
                      disabled={selectPlan.isPending}
                      onClick={() => handleSelect(plan.id as "free" | "starter" | "creator" | "pro")}
                    >
                      {selectPlan.isPending
                        ? "Please wait..."
                        : isFree
                          ? "Start Free"
                          : `Choose ${plan.name}`}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Free plan requires no payment. Paid plans activated after payment
            confirmation. Upgrade or cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
      <span>{text}</span>
    </div>
  );
}
