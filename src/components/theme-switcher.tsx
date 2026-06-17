"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { APP_THEMES, type AppTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

function ThemeSwatch({ theme, isActive }: { theme: AppTheme; isActive: boolean }) {
  return (
    <div
      className={cn(
        "relative h-8 w-full overflow-hidden rounded-md ring-1 ring-border/60",
        isActive && "ring-2 ring-primary ring-offset-1 ring-offset-background",
      )}
      style={{
        background: `linear-gradient(135deg, ${theme.swatch[0]} 0%, ${theme.swatch[1]} 50%, ${theme.swatch[2]} 100%)`,
      }}
    >
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Check className="size-3.5 text-white drop-shadow-sm" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeTheme = APP_THEMES.find((t) => t.id === theme) ?? APP_THEMES[0];
  const lightThemes = APP_THEMES.filter((t) => t.mode === "light");
  const darkThemes = APP_THEMES.filter((t) => t.mode === "dark");

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="gap-2" disabled>
        <Palette className="size-4" />
        {!compact && <span className="hidden sm:inline">Theme</span>}
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/60 bg-background/60 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-accent/50"
        >
          <div
            className="size-4 shrink-0 rounded-full ring-1 ring-border/50"
            style={{
              background: `linear-gradient(135deg, ${activeTheme.swatch[0]}, ${activeTheme.swatch[1]}, ${activeTheme.swatch[2]})`,
            }}
          />
          {!compact && (
            <span className="hidden max-w-24 truncate sm:inline">{activeTheme.name}</span>
          )}
          <Palette className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 border-border/60 bg-popover/95 p-0 shadow-2xl backdrop-blur-xl"
      >
        <div className="border-b border-border/60 px-4 py-3">
          <p className="text-sm font-semibold tracking-tight">Choose your theme</p>
          <p className="text-xs text-muted-foreground">30 curated palettes</p>
        </div>
        <ScrollArea className="h-80">
          <div className="space-y-4 p-4">
            <ThemeGroup
              label="Light"
              themes={lightThemes}
              activeId={theme ?? activeTheme.id}
              onSelect={setTheme}
            />
            <ThemeGroup
              label="Dark"
              themes={darkThemes}
              activeId={theme ?? activeTheme.id}
              onSelect={setTheme}
            />
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function ThemeGroup({
  label,
  themes,
  activeId,
  onSelect,
}: {
  label: string;
  themes: AppTheme[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className="group space-y-1.5 rounded-lg p-1.5 text-left transition-colors hover:bg-accent/60"
          >
            <ThemeSwatch theme={t} isActive={activeId === t.id} />
            <span className="block truncate px-0.5 text-[11px] font-medium leading-none">
              {t.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
