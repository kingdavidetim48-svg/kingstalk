"use client";

import { useStore } from "@tanstack/react-form";
import { FieldLabel } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { useTypedAppFormContext } from "@/hooks/use-app-form";

import { sliders } from "../data/sliders";
import { ttsFormOptions } from "./text-to-speech-form";
import { VoiceSelector } from "./voice-selector";

export function SettingsPanelSettings() {
  const form = useTypedAppFormContext(ttsFormOptions);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);

  return (
    <>
      <div className="border-b border-border/30 p-4">
        <VoiceSelector />
      </div>
      <div className="flex-1 space-y-1 px-4 py-2">
        {sliders.map((slider) => (
          <form.Field key={slider.id} name={slider.id}>
            {(field) => (
              <div className="space-y-2 border-b border-border/10 py-3 last:border-0">
                <div className="flex items-center justify-between">
                  <FieldLabel className="text-sm font-medium">
                    {slider.label}
                  </FieldLabel>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {field.state.value}
                  </span>
                </div>
                <Slider
                  value={[field.state.value]}
                  onValueChange={(value) => field.handleChange(value[0])}
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  disabled={isSubmitting}
                  className="**:data-[slot=slider-thumb]:size-3.5 **:data-[slot=slider-thumb]:bg-foreground **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-background **:data-[slot=slider-thumb]:shadow-md"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground/60">
                    {slider.leftLabel}
                  </span>
                  <span className="text-[11px] text-muted-foreground/60">
                    {slider.rightLabel}
                  </span>
                </div>
              </div>
            )}
          </form.Field>
        ))}
      </div>
    </>
  );
}
