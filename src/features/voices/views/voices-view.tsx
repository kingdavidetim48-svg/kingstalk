"use client";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { VoicesList } from "../components/voices-list";
import { voicesSearchParams } from "../lib/params";
import { VoicesToolbar } from "../components/voices-toolbar";

function VoicesErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <h2 className="text-xl font-semibold text-destructive">Failed to load voices</h2>
      <p className="text-muted-foreground max-w-md">
        There was an error loading your voices. Please try again.
      </p>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
}

function VoicesContent() {
  const trpc = useTRPC();
  const [query] = useQueryState("query", voicesSearchParams.query);
  const { data, isLoading } = useQuery(trpc.voices.getAll.queryOptions({ query }));
  
  if (isLoading) {
    return (
      <div className="space-y-10">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight opacity-50">Team Voices</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[1,2].map((i) => (
              <div key={i} className="h-24 rounded-xl border bg-muted/30 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight opacity-50">Built-in Voices</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[1,2].map((i) => (
              <div key={i} className="h-24 rounded-xl border bg-muted/30 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!data) return null;
  
  return (
    <>
      <VoicesList title="Team Voices" voices={data.custom} />
      <VoicesList title="Built-in Voices" voices={data.system} />
    </>
  );
}

export function VoicesView() {
  return (
    <div className="flex-1 space-y-10 overflow-y-auto p-3 lg:p-6">
      <VoicesToolbar />
      <ErrorBoundary FallbackComponent={VoicesErrorFallback}>
        <VoicesContent />
      </ErrorBoundary>
    </div>
  );
}
