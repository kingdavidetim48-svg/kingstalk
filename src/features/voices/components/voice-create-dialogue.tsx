"use client";

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
// import { useCheckout } from "@/features/billing/hooks/use-checkout";
import { useCallback } from "react";
import { toast } from "sonner";

interface VoiceCreateDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function VoiceCreateDialog({
  children,
  open,
  onOpenChange,
}: VoiceCreateDialogProps) {
  const isMobile = useIsMobile();

  //   const { checkout } = useCheckout();

  //   const handleError = useCallback(
  //     (message: string) => {
  //       if (message === "SUBSCRIPTION_REQUIRED") {
  //         toast.error("Subscription required", {
  //           action: {
  //             label: "Subscribe",
  //             onClick: () => checkout(),
  //           },
  //         });
  //       } else {
  //         toast.error(message);
  //       }
  //     },
  //     [checkout],
  //   );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create custom voice</DrawerTitle>
            <DrawerDescription>
              Upload or record an audio sample to add a new voice to your
              library.
            </DrawerDescription>
          </DrawerHeader>
          {/* <VoiceCreateForm
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
          /> */}
          <VoiceCreateForm
            scrollable
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
      <DialogContent className="flex h-[85vh] max-h-[700px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle>Create custom voice</DialogTitle>
          <DialogDescription>
            Upload or record an audio sample to add a new voice to your library.
          </DialogDescription>
        </DialogHeader>
        <VoiceCreateForm
          scrollable
          footer={(submit) => (
            <div className="flex items-center gap-2">
              {submit}
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </div>
          )}
        />
      </DialogContent>
    </Dialog>
  );
}
