import { AudioLines, BookOpen, Sparkles, Volume2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function VoicePreviewPlaceholder() {
  return (
    <div className="relative flex h-full flex-1 flex-col items-center justify-center gap-6 border-t border-border/30 bg-gradient-to-b from-transparent to-muted/10 lg:gap-8">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -inset-20 rounded-full bg-primary/5 blur-3xl" />

      <div className="flex flex-col items-center gap-5 lg:gap-6">
        {/* Icon cluster */}
        <div className="relative flex w-36 items-center justify-center lg:w-44">
          <div className="absolute inset-0 rounded-full bg-primary/8 blur-2xl" />
          <div className="absolute -left-1 -rotate-12 rounded-xl border border-border/40 bg-card/80 p-2.5 shadow-sm backdrop-blur-sm animate-float lg:rounded-2xl lg:p-3.5" style={{ animationDelay: "0.5s" }}>
            <Volume2 className="size-4 text-muted-foreground lg:size-5" />
          </div>
          <div className="relative z-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-4 shadow-[0_8px_32px_-8px_var(--glow)] animate-breathe lg:rounded-2xl lg:p-5">
            <Waves className="size-5 text-primary-foreground lg:size-6" />
          </div>
          <div className="absolute -right-1 rotate-12 rounded-xl border border-border/40 bg-card/80 p-2.5 shadow-sm backdrop-blur-sm animate-float lg:rounded-2xl lg:p-3.5" style={{ animationDelay: "1s" }}>
            <AudioLines className="size-4 text-muted-foreground lg:size-5" />
          </div>
        </div>

        <div className="space-y-1.5 text-center lg:space-y-2">
          <p className="font-display text-base font-semibold tracking-tight text-foreground lg:text-xl">
            Your audio awaits
          </p>
          <p className="max-w-56 text-xs leading-relaxed text-muted-foreground lg:max-w-72 lg:text-sm">
            Generate speech from your text above and the waveform preview will appear here.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-border/40 bg-background/60 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary/5"
        asChild
      >
        <Link href="mailto:aetim8273@gmail.com">
          <BookOpen className="size-3.5 lg:size-4" />
          <span className="text-xs lg:text-sm">How it works</span>
        </Link>
      </Button>
    </div>
  );
}
