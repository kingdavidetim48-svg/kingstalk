"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GradientInputShell } from "@/components/ui/gradient-input-shell";

import {
  COST_PER_UNIT,
  TEXT_MAX_LENGTH,
} from "@/features/text-to-speech/data/constants";

export function TextInputPanel() {
  const [text, setText] = useState("");
  const router = useRouter();

  const handleGenerate = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    router.push(`/app/text-to-speech?text=${encodeURIComponent(trimmed)}`);
  };

  return (
    <GradientInputShell>
      <div className="space-y-4 rounded-2xl bg-(--gradient-inner) p-3 shadow-sm lg:p-4">
        <Textarea
          placeholder="Start typing or paste your text here..."
          className="min-h-28 resize-none border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 lg:min-h-35 lg:text-base"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={TEXT_MAX_LENGTH}
        />
      </div>

      <div className="flex flex-col gap-2 px-1 pt-2 sm:flex-row sm:items-center sm:justify-between lg:pt-3">
        <Badge variant="outline" className="w-fit gap-1.5 border-dashed border-primary/20 bg-primary/5 px-2.5 py-0.5">
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
          {text.length.toLocaleString()} / {TEXT_MAX_LENGTH.toLocaleString()} characters
        </span>
      </div>

      <div className="flex justify-end px-1 pt-2 pb-1 lg:pt-3">
        <Button
          size="default"
          disabled={!text.trim()}
          onClick={handleGenerate}
          className="group relative w-full overflow-hidden bg-gradient-to-r from-primary to-primary/90 shadow-[0_4px_20px_-4px_var(--glow)] transition-all duration-300 hover:shadow-[0_6px_28px_-4px_var(--glow)] hover:scale-[1.02] active:scale-[0.98] lg:w-auto"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full rounded-inherit bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Sparkles className="size-4" />
          Generate
        </Button>
      </div>
    </GradientInputShell>
  );
}
