"use client";

import { useStore } from "@tanstack/react-form";
import { Coins } from "lucide-react";
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

export function TextInputPanel() {
  const form = useTypedAppFormContext(ttsFormOptions);
  const text = useStore(form.store, (s) => s.values.text);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);

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

        <span className="text-xs tabular-nums text-muted-foreground">
          {text.length.toLocaleString()} / {TEXT_MAX_LENGTH.toLocaleString()}{" "}
          characters
        </span>
      </div>

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
          disabled={!text.trim() || isSubmitting}
          isSubmitting={isSubmitting}
          type="submit"
        />
      </div>
    </GradientInputShell>
  );
}
