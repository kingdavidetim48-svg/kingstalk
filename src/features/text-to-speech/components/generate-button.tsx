"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function GenerateButton({
  size,
  disabled,
  isSubmitting,
  onSubmit,
  type = "submit",
  className,
}: {
  size?: "default" | "sm";
  disabled: boolean;
  isSubmitting: boolean;
  onSubmit?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}) {
  return (
    <Button
      size={size}
      type={type}
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "bg-gradient-to-r from-primary to-primary/90",
        "shadow-[0_4px_20px_-4px_var(--glow)]",
        "hover:shadow-[0_6px_28px_-4px_var(--glow)]",
        "hover:scale-[1.02] active:scale-[0.98]",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onClick={onSubmit}
      disabled={disabled}
    >
      {/* Shimmer overlay */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full rounded-inherit bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {isSubmitting ? (
        <>
          <Spinner className="size-4" />
          <span className="font-medium">Generating...</span>
        </>
      ) : (
        <>
          <Sparkles className="size-4" />
          <span className="font-medium">Generate speech</span>
        </>
      )}
    </Button>
  );
}
