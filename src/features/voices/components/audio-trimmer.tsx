"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Scissors, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/client-audio-utils";

import { Button } from "@/components/ui/button";

interface AudioTrimmerProps {
  file: File;
  onCropChange?: (start: number, end: number) => void;
  onReady?: (duration: number) => void;
  minDuration?: number;
  className?: string;
}

export function AudioTrimmer({
  file,
  onCropChange,
  onReady,
  minDuration = 10,
  className,
}: AudioTrimmerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const onCropChangeRef = useRef(onCropChange);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onCropChangeRef.current = onCropChange;
  });
  useEffect(() => {
    onReadyRef.current = onReady;
  });

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objUrl = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [file]);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    if (wsRef.current) {
      wsRef.current.destroy();
      wsRef.current = null;
    }

    let destroyed = false;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "hsl(var(--muted-foreground))",
      progressColor: "hsl(var(--chart-1))",
      cursorColor: "hsl(var(--primary))",
      cursorWidth: 0,
      barWidth: 3,
      barGap: 3,
      barRadius: 3,
      barMinHeight: 2,
      height: 80,
      normalize: true,
    });

    wsRef.current = ws;

    ws.on("ready", () => {
      if (destroyed) return;
      setIsReady(true);
      const d = ws.getDuration();
      setDuration(d);
      setEndTime(d);
      onReadyRef.current?.(d);
      onCropChangeRef.current?.(0, d);
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));

    (ws.load(url) as any).catch((err: any) => {
      console.error("WaveSurfer load error:", err);
    });

    return () => {
      destroyed = true;
      ws.destroy();
    };
  }, [url]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStartTime(0);
    setEndTime(duration);
  }, [duration]);

  const setStart = useCallback(() => {
    if (!wsRef.current) return;
    const t = wsRef.current.getCurrentTime();
    if (t < endTime) {
      setStartTime(t);
      onCropChange?.(t, endTime);
    }
  }, [endTime, onCropChange]);

  const setEnd = useCallback(() => {
    if (!wsRef.current) return;
    const t = wsRef.current.getCurrentTime();
    if (t > startTime) {
      setEndTime(t);
      onCropChange?.(startTime, t);
    }
  }, [startTime, onCropChange]);

  const togglePlay = useCallback(() => {
    wsRef.current?.playPause();
  }, []);

  const cropDuration = endTime - startTime;
  const isBelowMin = cropDuration < minDuration;

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-border/50 bg-gradient-to-r from-background via-background to-muted/30 p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Trim audio</span>
        <span className="max-w-[200px] truncate text-xs text-muted-foreground">
          {file.name}
        </span>
      </div>

      <div ref={containerRef} className="relative rounded-lg bg-muted/10">
        <div className="pointer-events-none absolute inset-0 z-10">
          <div
            className="absolute inset-y-0 left-0 bg-background/60"
            style={{
              width: duration > 0 ? `${(startTime / duration) * 100}%` : "0%",
            }}
          />
          <div
            className="absolute inset-y-0 right-0 bg-background/60"
            style={{
              width:
                duration > 0
                  ? `${((duration - endTime) / duration) * 100}%`
                  : "0%",
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePlay}
            disabled={!isReady}
            className="size-8 p-0"
          >
            {isPlaying ? (
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={setStart}
            disabled={!isReady}
          >
            <Scissors className="size-3.5" />
            Start
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={setEnd}
            disabled={!isReady}
          >
            <Scissors className="size-3.5" />
            End
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            Start: {formatDuration(startTime)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            End: {formatDuration(endTime)}
          </span>
          <span
            className={cn(
              "font-medium",
              isBelowMin
                ? "text-destructive"
                : "text-[var(--gradient-from)]",
            )}
          >
            {formatDuration(cropDuration)}
            {isBelowMin && " (min 10s)"}
          </span>
        </div>
      </div>
    </div>
  );
}
