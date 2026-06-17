"use client";

import { Pause, Play, Download, SkipBack, SkipForward, Volume2, Waves } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { VoiceAvatar } from "@/components/voice-avatar/voice-avatar";
import { useWaveSurfer } from "../hooks/use-wavesurfer";
import { cn } from "@/lib/utils";

type VoicePreviewMobileVoice = {
  id?: string;
  name: string;
};

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "00:00";
  return format(new Date(seconds * 1000), "mm:ss");
}

export function VoicePreviewMobile({
  audioUrl,
  voice,
  text,
}: {
  audioUrl: string;
  voice: VoicePreviewMobileVoice | null;
  text: string;
}) {
  const selectedVoiceName = voice?.name ?? null;
  const selectedVoiceSeed = voice?.id ?? null;

  const {
    containerRef,
    isPlaying,
    isReady,
    currentTime,
    duration,
    togglePlayPause,
    seekBackward,
    seekForward,
  } = useWaveSurfer({
    url: audioUrl,
    autoplay: true,
  });

  const handleDownload = () => {
    const safeName =
      text
        .slice(0, 50)
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "speech";
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${safeName}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!audioUrl) return null;

  return (
    <div className="mx-3 mb-3 mt-auto overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-b from-background to-muted/20 lg:hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/20 px-4 py-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
          <Waves className="size-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold text-foreground">Voice preview</span>
        {selectedVoiceName && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <VoiceAvatar
              seed={selectedVoiceSeed ?? selectedVoiceName}
              name={selectedVoiceName}
              className="size-3.5"
            />
            <span className="truncate max-w-24">{selectedVoiceName}</span>
          </div>
        )}
      </div>

      {/* Waveform */}
      <div className="px-4 pt-3">
        <div
          ref={containerRef}
          className={cn(
            "w-full cursor-pointer transition-all duration-500",
            !isReady && "opacity-30",
          )}
        />
      </div>

      {/* Time */}
      <div className="mt-1 flex items-center justify-between px-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Volume2 className="size-3" />
          <span className="line-clamp-1 max-w-36">{text}</span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground/70">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 px-4 pb-3 pt-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground/60"
          onClick={() => seekBackward(10)}
          disabled={!isReady}
        >
          <SkipBack className="size-3.5" />
        </Button>

        <Button
          variant="default"
          size="icon"
          className={cn(
            "relative size-11 rounded-full shadow-md transition-all duration-300",
            isPlaying && "shadow-primary/25",
            "hover:scale-105 active:scale-95",
          )}
          onClick={togglePlayPause}
          disabled={!isReady}
        >
          {isPlaying ? (
            <Pause className="size-4 fill-background" />
          ) : (
            <Play className="size-4 ml-0.5 fill-background" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground/60"
          onClick={() => seekForward(10)}
          disabled={!isReady}
        >
          <SkipForward className="size-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-full border-border/30 text-muted-foreground/60"
          onClick={handleDownload}
        >
          <Download className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
