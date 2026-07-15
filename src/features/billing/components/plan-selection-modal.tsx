"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface PlanSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center">
            Select a plan to start generating speech
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-4">
          {plans?.map((plan: any) => {
            const isFree = plan.id === "free";
            const isPopular = plan.id === "starter";
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${isPopular ? "border-primary/50 ring-1 ring-primary/20" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                      <Sparkles className="size-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className={`text-center ${isPopular ? "pt-7" : ""}`}>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    {isFree ? (
                      <span className="text-3xl font-bold text-foreground">Free</span>
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
                  {plan.fasterGeneration && <FeatureRow text="Faster generation speed" />}
                  {plan.apiAccess && <FeatureRow text="API access" />}
                  {plan.teamCollaboration && <FeatureRow text="Team collaboration" />}
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isFree ? "outline" : "default"}
                    disabled={selectPlan.isPending}
                    onClick={() => handleSelect(plan.id as "free" | "starter" | "creator" | "pro")}
                  >
                    {isFree ? "Start Free" : `Choose ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
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
