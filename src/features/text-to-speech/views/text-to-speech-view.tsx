"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { TTSVoicesProvider } from "../contexts/tts-voices-context";
import { TextInputPanel } from "../components/text-input-panel";
import { VoicePreviewPlaceholder } from "@/features/text-to-speech/components/voice-preview-placeholder";
import { SettingsPanel } from "@/features/text-to-speech/components/settings-panel";

import {
  TextToSpeechForm,
  defaultTTSValues,
  type TTSFormValues,
} from "@/features/text-to-speech/components/text-to-speech-form";

function TTSFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-xl font-semibold text-destructive">Failed to load</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        {(error instanceof Error ? error.message : "Could not load text-to-speech data. Please try again.")}
      </p>
      <Button onClick={resetErrorBoundary} className="mt-4">
        Retry
      </Button>
    </div>
  );
}

function TTSContent({
  initialValues,
}: {
  initialValues?: Partial<TTSFormValues>;
}) {
  const trpc = useTRPC();
  const { data: voices } = useSuspenseQuery(trpc.voices.getAll.queryOptions());

  const { custom: customVoices, system: systemVoices } = voices;
  const allVoices = [...customVoices, ...systemVoices];
  const fallbackVoiceId = allVoices[0]?.id ?? "";

  const resolvedVoiceId =
    initialValues?.voiceId &&
      allVoices.some((v) => v.id === initialValues.voiceId)
      ? initialValues.voiceId
      : fallbackVoiceId;

  const defaultValues: TTSFormValues = {
    ...defaultTTSValues,
    ...initialValues,
    voiceId: resolvedVoiceId,
  };

  return (
    <TTSVoicesProvider value={{ customVoices, systemVoices, allVoices }}>
      <TextToSpeechForm defaultValues={defaultValues}>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto lg:flex-row">
          <div className="flex min-h-0 flex-1 flex-col">
            <TextInputPanel />
            <div className="hidden flex-1 lg:flex">
              <VoicePreviewPlaceholder />
            </div>
          </div>
          <SettingsPanel />
        </div>
      </TextToSpeechForm>
    </TTSVoicesProvider>
  );
}

export function TextToSpeechView({
  initialValues,
}: {
  initialValues?: Partial<TTSFormValues>;
}) {
  return (
    <ErrorBoundary FallbackComponent={TTSFallback}>
      <TTSContent initialValues={initialValues} />
    </ErrorBoundary>
  );
}
