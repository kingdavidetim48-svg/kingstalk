import { Sparkles } from "lucide-react";
import { quickActions } from "../data/quick-actions";
import { QuickActionCard } from "./quick-action-card";

export function QuickActionsPanel() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-3.5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Quick actions</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((action, i) => (
          <QuickActionCard
            key={action.title}
            index={i}
            title={action.title}
            description={action.description}
            gradient={action.gradient}
            href={action.href}
          />
        ))}
      </div>
    </div>
  );
}
