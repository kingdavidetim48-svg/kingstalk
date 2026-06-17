"use client";
import { VoiceAvatar } from "@/components/voice-avatar/voice-avatar";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AudioLines, AudioWaveform, Clock, History } from "lucide-react";
import Link from "next/link";

export function SettingsPanelHistory() {
  const trpc = useTRPC();

  const { data: generations } = useSuspenseQuery(
    trpc.generations.getAll.queryOptions(),
  );

  if (!generations.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="relative flex w-28 items-center justify-center">
          <div className="absolute -left-1 -rotate-12 rounded-xl border border-border/40 bg-card/80 p-2.5 shadow-sm backdrop-blur-sm">
            <AudioLines className="size-4 text-muted-foreground" />
          </div>
          <div className="relative z-10 rounded-xl bg-gradient-to-br from-foreground to-foreground/80 p-3 shadow-sm">
            <AudioWaveform className="size-5 text-background" />
          </div>
          <div className="absolute -right-1 rotate-12 rounded-xl border border-border/40 bg-card/80 p-2.5 shadow-sm backdrop-blur-sm">
            <Clock className="size-4 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <p className="font-semibold tracking-tight text-foreground">
            No generations yet
          </p>
          <p className="max-w-48 text-center text-xs text-muted-foreground">
            Generate some audio and it will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {generations.map((generation) => (
        <Link
          href={`/text-to-speech/${generation.id}`}
          key={generation.id}
          className="group flex items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 hover:bg-muted/80 hover:shadow-sm"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-sm font-medium text-foreground">
              {generation.text}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <VoiceAvatar
                seed={generation.voiceId ?? generation.voiceName}
                name={generation.voiceName}
                className="size-3.5"
              />
              <span>{generation.voiceName}</span>
              <span className="text-[10px]">&middot;</span>
              <span className="tabular-nums">
                {formatDistanceToNow(new Date(generation.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          <div className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <AudioWaveform className="size-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}
