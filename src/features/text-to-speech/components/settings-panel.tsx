import { History, Settings, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsPanelHistory } from "./settings-panel-history";
import { SettingsPanelSettings } from "./settings-panel-settings";

const tabTriggerClassName =
  "flex-1 h-full gap-2 bg-transparent rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent shadow-none data-[state=active]:border-b-primary data-[state=active]:text-foreground font-medium text-sm text-muted-foreground transition-all duration-200";

export function SettingsPanel() {
  return (
    <div className="hidden w-[26rem] min-h-0 flex-col border-l border-border/40 bg-gradient-to-b from-sidebar/50 to-sidebar/30 backdrop-blur-sm lg:flex">
      <Tabs
        defaultValue="settings"
        className="flex h-full min-h-0 flex-col gap-y-0"
      >
        <TabsList className="h-12 w-full rounded-none border-b border-border/40 bg-transparent p-0">
          <TabsTrigger value="settings" className={tabTriggerClassName}>
            <Settings className="size-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="history" className={tabTriggerClassName}>
            <History className="size-4" />
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="settings"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <SettingsPanelSettings />
        </TabsContent>
        <TabsContent
          value="history"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <SettingsPanelHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
