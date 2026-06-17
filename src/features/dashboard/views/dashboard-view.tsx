import { PageHeader } from "@/components/page-header";
import { HeroPattern } from "../components/hero-pattern";
import { DashboardHeader } from "../components/dashboard-header";
import { TextInputPanel } from "../components/text-input-panel";
import { QuickActionsPanel } from "../components/quick-actions-panel";

export function DashboardView() {
  return (
    <div className="relative min-h-full overflow-x-hidden">
      <PageHeader title="Dashboard" className="lg:hidden" />
      <HeroPattern />
      <div className="relative mx-auto max-w-6xl space-y-10 p-4 pb-16 lg:p-16">
        <DashboardHeader />
        <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <TextInputPanel />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <QuickActionsPanel />
        </div>
      </div>
    </div>
  );
}
