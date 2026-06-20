"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function OrgGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, orgId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !orgId) {
      router.replace("/org-selection");
    }
  }, [isLoaded, orgId, router]);

  if (!isLoaded || !orgId) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
