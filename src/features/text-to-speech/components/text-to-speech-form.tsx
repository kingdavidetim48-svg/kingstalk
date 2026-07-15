"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formOptions } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { useAppForm } from "@/hooks/use-app-form";
import { useCheckout } from "@/features/billing/hooks/use-checkout";
import { PlanSelectionModal } from "@/features/billing/components/plan-selection-modal";

const ttsFormSchema = z.object({
  text: z.string().min(1, "Please enter some text"),
  voiceId: z.string().min(1, "Please select a voice"),
  temperature: z.number(),
  topP: z.number(),
  topK: z.number(),
  repetitionPenalty: z.number(),
});

export type TTSFormValues = z.infer<typeof ttsFormSchema>;

export const defaultTTSValues: TTSFormValues = {
  text: "",
  voiceId: "",
  temperature: 0.8,
  topP: 0.95,
  topK: 1000,
  repetitionPenalty: 1.2,
};

export const ttsFormOptions = formOptions({
  defaultValues: defaultTTSValues,
});

export function TextToSpeechForm({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues?: TTSFormValues;
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Prefetch billing status so we can show the plan-selection modal
  // immediately on submit rather than waiting for an API round-trip.
  const { data: billingStatus } = useQuery(
    trpc.billing.getStatus.queryOptions(),
  );

  const createMutation = useMutation(
    trpc.generations.create.mutationOptions({}),
  );

  const { checkout } = useCheckout();

  const form = useAppForm({
    ...ttsFormOptions,
    defaultValues: defaultValues ?? defaultTTSValues,
    validators: {
      // TanStack Form runs this schema synchronously on every submit attempt.
      // If validation fails the onSubmit callback is never called and
      // form.state.errors is populated so field-level error UI can render.
      onSubmit: ttsFormSchema,
    },
    onSubmit: async ({ value }: any) => {
      // Client-side subscription guard: only block when billing data has
      // actually loaded and confirmed no subscription. If data is still
      // loading (undefined), proceed to the mutation and let the server
      // enforce the subscription check — this avoids showing the plan
      // modal on the first click before hydration completes.
      if (billingStatus && !billingStatus.hasActiveSubscription) {
        setShowPlanModal(true);
        return;
      }

      try {
        const data = await createMutation.mutateAsync({
          text: value.text.trim(),
          voiceId: value.voiceId,
          temperature: value.temperature,
          topP: value.topP,
          topK: value.topK,
          repetitionPenalty: value.repetitionPenalty,
        });

        toast.success("Audio generated successfully!");
        router.push(`/app/text-to-speech/${data.id}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to generate audio";

        if (message === "SUBSCRIPTION_REQUIRED") {
          // The server rejected the request — show the modal so the user can
          // choose a plan even if the client-side billing status was stale.
          setShowPlanModal(true);
        } else if (message.startsWith("PER_GENERATION_LIMIT_EXCEEDED")) {
          const readable = message.replace("PER_GENERATION_LIMIT_EXCEEDED: ", "");
          toast.error(readable, {
            action: {
              label: "Upgrade",
              onClick: () => checkout(),
            },
            duration: 6000,
          });
        } else if (message.startsWith("MONTHLY_LIMIT_EXCEEDED")) {
          const readable = message.replace("MONTHLY_LIMIT_EXCEEDED: ", "");
          toast.error(readable, {
            action: {
              label: "Upgrade",
              onClick: () => checkout(),
            },
            duration: 6000,
          });
        } else if (message.startsWith("VOICE_LIMIT_REACHED")) {
          const readable = message.replace("VOICE_LIMIT_REACHED: ", "");
          toast.error(readable, {
            duration: 6000,
          });
        } else {
          toast.error(message);
        }
      }
    },
  });

  return (
    <>
      <form.AppForm>
        {/*
         * form.AppForm is a React context provider only — it renders
         * <formContext.Provider> with NO underlying <form> DOM element.
         *
         * A real HTML <form> is required so that:
         *   1. Buttons with type="submit" fire the native "submit" event.
         *   2. The native submit event is intercepted here and routed to
         *      form.handleSubmit(), which runs TanStack Form validation
         *      (onSubmit schema) and then calls our onSubmit callback.
         *   3. Keyboard accessibility is preserved: pressing Enter in a
         *      single-line <input> still submits the form as expected.
         *
         * noValidate suppresses all browser-native constraint validation.
         * TanStack Form owns validation entirely via the onSubmit schema.
         *
         * className="contents" makes the <form> a layout-transparent wrapper
         * so it does not disturb the flex/grid layout of its children.
         */}
        <form
          className="contents"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // form.handleSubmit() is async and idempotent: TanStack Form
            // sets isSubmitting=true for the duration of the async handler
            // and ignores concurrent calls, so double-submit is impossible.
            void form.handleSubmit();
          }}
        >
          {children}
        </form>
      </form.AppForm>

      {/*
       * PlanSelectionModal lives outside <form.AppForm> and the <form>
       * so that dialog buttons are never accidentally treated as form
       * submit triggers.
       */}
      <PlanSelectionModal
        open={showPlanModal}
        onOpenChange={setShowPlanModal}
      />
    </>
  );
}
