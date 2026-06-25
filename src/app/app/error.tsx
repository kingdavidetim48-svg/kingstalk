"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <h1 className="text-4xl font-bold text-red-500">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred in this section. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
