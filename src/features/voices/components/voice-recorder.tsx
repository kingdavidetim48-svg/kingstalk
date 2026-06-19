import {
  Mic,
  Square,
  RotateCcw,
  X,
  FileAudio,
  Play,
  Pause,
} from "lucide-react";

import { cn, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { useAudioRecorder } from "@/features/voices/hooks/use-audio-recorder";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function VoiceRecorder({
  file,
  onFileChange,
  isInvalid,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  isInvalid?: boolean;
}) {
  const { isPlaying, togglePlay } = useAudioPlayback(file);

  const {
    isRecording,
    elapsedTime,
    audioBlob,
    containerRef,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const handleStop = () => {
    stopRecording((blob) => {
      const recordedFile = new File([blob], "recording.wav", {
        type: "audio/wav",
      });
      onFileChange(recordedFile);
    });
  };

  const handleReRecord = () => {
    onFileChange(null);
    resetRecording();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-destructive/50 bg-destructive/5 px-6 py-10">
        <p className="text-center text-sm text-destructive">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetRecording}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-background via-background to-muted/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gradient-from)]/10 to-[var(--gradient-via)]/10">
          <FileAudio className="size-5 text-[var(--gradient-from)]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
            {audioBlob && elapsedTime > 0 && (
              <>&nbsp;&middot;&nbsp;{formatTime(elapsedTime)}</>
            )}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={togglePlay}
          title={isPlaying ? "Pause" : "Play"}
          className="rounded-full transition-all hover:bg-[var(--gradient-from)]/10 hover:text-[var(--gradient-from)]"
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleReRecord}
          title="Re-record"
          className="rounded-full transition-all hover:bg-[var(--gradient-from)]/10 hover:text-[var(--gradient-from)]"
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleReRecord}
          title="Remove"
          className="rounded-full transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-[var(--gradient-from)]/5 via-background to-background shadow-sm">
        <div ref={containerRef} className="w-full" />
        <div className="flex items-center justify-between border-t border-border/30 p-4">
          <p className="text-[28px] font-semibold leading-[1.2] tracking-tight text-[var(--gradient-from)]">
            {formatTime(elapsedTime)}
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={handleStop}
            className="shadow-lg shadow-destructive/20"
          >
            <Square className="size-3" />
            Stop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-500",
        isInvalid
          ? "border-destructive/70 bg-destructive/5"
          : "border-border/40 bg-gradient-to-b from-muted/20 to-transparent hover:border-[var(--gradient-from)]/30 hover:bg-[var(--gradient-from)]/5",
      )}
    >
      <div className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-[var(--gradient-from)]/10 via-[var(--gradient-via)]/10 to-[var(--gradient-from)]/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gradient-from)]/15 to-[var(--gradient-via)]/10 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
        <Mic className="size-6 text-[var(--gradient-from)] transition-transform duration-300 group-hover:scale-110" />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-base font-semibold tracking-tight">
          Record your voice
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Click record to start capturing audio
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={startRecording}
        className="relative transition-all group-hover:border-[var(--gradient-from)]/30 group-hover:bg-[var(--gradient-from)]/5 group-hover:shadow-sm"
      >
        <Mic className="size-3.5" />
        Record
      </Button>
    </div>
  );
}
