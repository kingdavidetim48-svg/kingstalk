"use client";

import { useCallback } from "react";
import { Mic } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { VoiceCreateForm } from "./voice-create-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCheckout } from "@/features/billing/hooks/use-checkout";

interface VoiceCreateDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function DialogShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-background/95 via-background/98 to-background shadow-2xl backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 mesh-bg-subtle opacity-50" />
      <div className="pointer-events-none absolute right-0 top-0 -mr-20 -mt-20 size-64 rounded-full bg-gradient-to-br from-[var(--gradient-from)]/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 -mb-20 -ml-20 size-48 rounded-full bg-gradient-to-tr from-[var(--gradient-via)]/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gradient-from)]/40 to-transparent" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function VoiceCreateDialog({
  children,
  open,
  onOpenChange,
}: VoiceCreateDialogProps) {
  const isMobile = useIsMobile();

  const { checkout } = useCheckout();

  const handleError = useCallback(
    (message: string) => {
      if (message === "SUBSCRIPTION_REQUIRED") {
        toast.error("Subscription required", {
          action: {
            label: "Subscribe",
            onClick: () => checkout(),
          },
        });
      } else {
        toast.error(message);
      }
    },
    [checkout],
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create custom voice</DrawerTitle>
            <DrawerDescription>
              Upload or record an audio sample to add a new voice.
            </DrawerDescription>
          </DrawerHeader>
          <VoiceCreateForm
            scrollable
            onError={handleError}
            footer={(submit) => (
              <DrawerFooter>
                {submit}
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            )}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="flex h-[82vh] max-h-[680px] w-[95vw] flex-col gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-[560px]">
        <DialogShell>
          <DialogHeader className="relative px-8 pt-8 pb-5 text-left">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gradient-from)]/20 to-[var(--gradient-via)]/10 ring-1 ring-[var(--gradient-from)]/20">
                <Mic className="size-5 text-[var(--gradient-from)]" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Create custom voice
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-sm">
                  Upload or record an audio sample to add a new voice to your
                  library.
                </DialogDescription>
              </div>
            </div>
            <div className="absolute right-8 top-8 flex items-center gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-3 w-0.5 rounded-full bg-gradient-to-t from-[var(--gradient-from)]/40 to-[var(--gradient-via)]/60 animate-waveform"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          </DialogHeader>

          <VoiceCreateForm
            scrollable
            onError={handleError}
            footer={(submit) => (
              <div className="flex items-center gap-3">
                {submit}
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="border-border/60 bg-background/60 backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-sm"
                  >
                    Cancel
                  </Button>
                </DialogClose>
              </div>
            )}
          />
        </DialogShell>
      </DialogContent>
    </Dialog>
  );
}
