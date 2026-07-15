import { cookies } from "next/headers";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { OrgGuard } from "@/features/dashboard/components/org-guard";
import { OnboardingGuard } from "@/features/billing/components/onboarding-guard";
import { BlockedUserGuard } from "@/features/billing/components/blocked-user-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
      <DashboardSidebar />
      <SidebarInset className="min-h-0 min-w-0 mesh-bg">
        <main className="flex min-h-0 flex-1 flex-col">
          <OrgGuard>
            <BlockedUserGuard>
              <OnboardingGuard>{children}</OnboardingGuard>
            </BlockedUserGuard>
          </OrgGuard>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
