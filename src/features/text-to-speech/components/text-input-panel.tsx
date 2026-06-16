"use client";

import { useStore } from "@tanstack/react-form";
import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useTypedAppFormContext } from "@/hooks/use-app-form";
import { ttsFormOptions } from "./text-to-speech-form";
import { GenerateButton } from "./generate-button";
import {
  COST_PER_UNIT,
  TEXT_MAX_LENGTH,
} from "@/features/text-to-speech/data/constants";

export function TextInputPanel() {
  const form = useTypedAppFormContext(ttsFormOptions);
  const text = useStore(form.store, (s) => s.values.text);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);

  return (
    <div className="rounded-[22px] bg-linear-185 from-[#ff8ee3] from-15% via-[#57d7e0] via-39% to-[#dbf1f2] to-85% p-0.5 shadow-[0_0_0_4px_white]">
      {/* Outer gradient border */}
      <div className="rounded-[20px] bg-[#f9f9f9] p-1">
        <div className="space-y-4 rounded-2xl bg-white p-4 drop-shadow-xs">
          {/* Input Area */}
          <form.Field name="text">
            {(field) => (
              <Textarea
                placeholder="Start typing or paste your text here."
                className="min-h-35 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                maxLength={TEXT_MAX_LENGTH}
                disabled={isSubmitting}
              />
            )}
          </form.Field>
        </div>

        {/* Bottom Info Section */}
        <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <Badge variant="outline" className="w-fit gap-1.5 border-dashed">
            <Coins className="size-3 text-chart-5" />

            <span className="text-xs">
              {text.length === 0 ? (
                "Start typing to estimate"
              ) : (
                <>
                  <span className="tabular-nums">
                    ${(text.length * COST_PER_UNIT).toFixed(4)}
                  </span>{" "}
                  estimated
                </>
              )}
            </span>
          </Badge>

          <span className="text-xs text-muted-foreground">
            {text.length.toLocaleString()} / {TEXT_MAX_LENGTH.toLocaleString()}{" "}
            characters
          </span>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end pt-3">
          <GenerateButton
            size="sm"
            className="w-full lg:w-auto"
            disabled={!text.trim() || isSubmitting}
            isSubmitting={isSubmitting}
            type="submit"
          />
        </div>
      </div>
    </div>
  );
}
