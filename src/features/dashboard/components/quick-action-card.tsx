import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import { type QuickAction } from "../data/quick-actions";
import { cn } from "@/lib/utils";

type QuickActionCardProps = QuickAction & { index?: number };

export function QuickActionCard({
  title,
  description,
  gradient,
  href,
  index = 0,
}: QuickActionCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-5 premium-shadow transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_48px_-12px_var(--glow)]"
      style={{
        animation: `fade-in-up 0.6s ease-out both`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Gradient blob */}
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 size-36 rounded-full opacity-15 blur-3xl transition-all duration-500 group-hover:opacity-30 group-hover:scale-110 bg-linear-to-br",
          gradient,
        )}
      />

      {/* Inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex gap-4">
        <div
          className={cn(
            "relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-linear-to-br shadow-inner ring-1 ring-white/10",
            gradient,
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Sparkles className="size-5 text-white drop-shadow-sm" />
            </div>
          </div>
          <div className="absolute inset-2 rounded-lg ring-1 ring-inset ring-white/20" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-0.5">
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold tracking-tight">{title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="outline"
            size="xs"
            className="w-fit border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-200 group-hover:border-primary/30 group-hover:bg-primary/5"
            asChild
          >
            <Link href={href}>
              Try now
              <ArrowRight className="size-3 transition-all duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
