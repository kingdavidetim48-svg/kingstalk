"use client";

import { useStore } from "@tanstack/react-form";
import { Coins, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { GradientInputShell } from "@/components/ui/gradient-input-shell";
import { useTypedAppFormContext } from "@/hooks/use-app-form";
import { ttsFormOptions } from "./text-to-speech-form";
import { SettingsDrawer } from "./settings-drawer";
import { HistoryDrawer } from "./history-drawer";
import { VoiceSelectorButton } from "./voice-selector-button";
import { GenerateButton } from "./generate-button";
import {
  COST_PER_UNIT,
  TEXT_MAX_LENGTH,
} from "@/features/text-to-speech/data/constants";
import { PromptSuggestions } from "./prompt-suggestions";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function TextInputPanel() {
  const form = useTypedAppFormContext(ttsFormOptions);
  const text = useStore(form.store, (s) => s.values.text);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);
  const trpc = useTRPC();
  
  const { data: billingStatus } = useQuery(trpc.billing.getStatus.queryOptions());
  
  const plan = billingStatus?.plan;
  const usage = billingStatus?.usage;
  
  const perGenLimit = plan?.perGenerationCharacterLimit ?? 2000;
  const monthlyLimit = plan?.monthlyCharacterLimit ?? 10000;
  const monthlyUsed = usage?.currentUsageCharacters ?? 0;
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
  
  const charCount = text.length;
  const exceedsPerGen = charCount > perGenLimit;
  const exceedsMonthly = charCount > monthlyRemaining;
  const canGenerate = charCount > 0 && !exceedsPerGen && !exceedsMonthly;

  return (
    <GradientInputShell className="mx-3 mt-3 lg:mx-6 lg:mt-6">
      <div className="space-y-4 rounded-2xl bg-(--gradient-inner) p-3 shadow-sm transition-shadow duration-300 lg:p-4">
        <form.Field name="text">
          {(field) => (
            <Textarea
              placeholder="Start typing or paste your text here..."
              className="min-h-28 resize-none border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 lg:min-h-35 lg:text-base"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              maxLength={TEXT_MAX_LENGTH}
              disabled={isSubmitting}
            />
          )}
        </form.Field>
      </div>

      <div className="flex flex-col gap-2 px-1 pt-2 sm:flex-row sm:items-center sm:justify-between lg:pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="w-fit gap-1.5 border-dashed border-primary/20 bg-primary/5 px-2.5 py-0.5"
          >
            <Coins className="size-3 text-primary" />
            <span className="text-xs">
              {text.length === 0 ? (
                "Start typing to estimate"
              ) : (
                <>
                  <span className="tabular-nums font-medium">
                    ${(text.length * COST_PER_UNIT).toFixed(4)}
                  </span>{" "}
                  estimated
                </>
              )}
            </span>
          </Badge>
          
          {plan && (
            <Badge
              variant={exceedsPerGen || exceedsMonthly ? "destructive" : "outline"}
              className="gap-1.5 px-2.5 py-0.5"
            >
              {exceedsPerGen || exceedsMonthly ? (
                <AlertTriangle className="size-3" />
              ) : (
                <Coins className="size-3" />
              )}
              <span className="text-xs tabular-nums">
                {charCount.toLocaleString()} / {perGenLimit.toLocaleString()} per gen
              </span>
            </Badge>
          )}
        </div>

        <span className="text-xs tabular-nums text-muted-foreground">
          {text.length.toLocaleString()} / {TEXT_MAX_LENGTH.toLocaleString()}{" "}
          characters
        </span>
      </div>
      
      {plan && (
        <div className="px-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Monthly remaining</span>
            <span className={`tabular-nums font-medium ${
              exceedsMonthly ? "text-destructive" : "text-foreground"
            }`}>
              {monthlyRemaining.toLocaleString()} / {monthlyLimit.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                monthlyRemaining <= 0
                  ? "bg-destructive"
                  : monthlyRemaining <= monthlyLimit * 0.1
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-primary/80 to-primary"
              }`}
              style={{ width: `${Math.min(100, (monthlyRemaining / monthlyLimit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="px-1">
        <PromptSuggestions
          onSelect={(prompt) => form.setFieldValue("text", prompt)}
        />
      </div>

      <div className="flex items-center gap-2 px-1 pt-2 lg:pt-3">
        <SettingsDrawer>
          <VoiceSelectorButton />
        </SettingsDrawer>
        <HistoryDrawer />
      </div>

      <div className="flex justify-end px-1 pt-2 pb-1 lg:pt-3">
        <GenerateButton
          size="default"
          className="w-full lg:w-auto lg:text-sm"
          disabled={!canGenerate || isSubmitting}
          isSubmitting={isSubmitting}
          type="submit"
        />
      </div>
      
      {exceedsPerGen && (
        <p className="px-1 text-xs text-destructive">
          Text exceeds per-generation limit ({perGenLimit.toLocaleString()} characters)
        </p>
      )}
      
      {exceedsMonthly && !exceedsPerGen && (
        <p className="px-1 text-xs text-destructive">
          Not enough monthly quota ({monthlyRemaining.toLocaleString()} characters remaining)
        </p>
      )}
    </GradientInputShell>
  );
}
