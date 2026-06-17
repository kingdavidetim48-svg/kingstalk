import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { SettingsPanelSettings } from "./settings-panel-settings";

interface SettingsDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function SettingsDrawer({
  open,
  onOpenChange,
  children,
}: SettingsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {children ?? (
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="size-4" />
          </Button>
        </DrawerTrigger>
      )}

      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="relative border-b border-border/30">
          <DrawerTitle className="flex items-center gap-2">
            <Settings className="size-4" />
            Settings
          </DrawerTitle>
          <DrawerClose className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground">
            <X className="size-4" />
          </DrawerClose>
        </DrawerHeader>
        <div className="overflow-y-auto pb-6">
          <SettingsPanelSettings />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
