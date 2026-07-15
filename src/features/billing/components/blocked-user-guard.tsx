"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useTRPC } from "@/trpc/client";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BlockedUserGuard({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const trpc = useTRPC();

  const { data: blockStatus } = useQuery({
    ...trpc.adminUsers.isBlocked.queryOptions({ userId: userId ?? "" }),
    enabled: !!userId && isLoaded,
  });

  if (!isLoaded || !blockStatus) {
    return <>{children}</>;
  }

  if (blockStatus.isBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="mx-auto max-w-md text-center space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="size-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access Revoked</h1>
          <p className="text-muted-foreground">
            Your account has been suspended. You no longer have access to
            KingsTalk.
          </p>
          {blockStatus.reason && (
            <p className="text-sm text-muted-foreground italic">
              Reason: {blockStatus.reason}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, please contact support.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
