"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Status =
  | "loading"
  | "unsupported"
  | "denied"
  | "subscribed"
  | "unsubscribed";

export function PushNotificationManager() {
  const [status, setStatus] = useState<Status>("loading");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        const existing = await reg.pushManager.getSubscription();
        setStatus(existing ? "subscribed" : "unsubscribed");
      })
      .catch(() => setStatus("unsupported"));
  }, []);

  const subscribe = async () => {
    if (!VAPID_PUBLIC_KEY) {
      toast.error("Push notifications not configured on the server.");
      return;
    }
    setIsBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        toast.error("Notification permission denied.");
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (!res.ok) throw new Error("Failed to save subscription");
      setStatus("subscribed");
      toast.success(
        "Push notifications enabled! You'll get alerts on this device.",
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not enable push notifications.");
    } finally {
      setIsBusy(false);
    }
  };

  const unsubscribe = async () => {
    setIsBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
      toast.success("Push notifications disabled.");
    } catch (err) {
      console.error(err);
      toast.error("Could not disable push notifications.");
    } finally {
      setIsBusy(false);
    }
  };

  if (status === "loading" || status === "unsupported") return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">
          Mobile push notifications
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {status === "subscribed"
            ? "You'll receive push alerts on this device for sign-ups, logins, and payments."
            : status === "denied"
              ? "Notification permission is blocked. Enable it in browser settings."
              : "Enable to receive instant alerts on this device."}
        </p>
      </div>
      {status !== "denied" && (
        <Button
          variant={status === "subscribed" ? "outline" : "default"}
          size="sm"
          onClick={status === "subscribed" ? unsubscribe : subscribe}
          disabled={isBusy}
          className="shrink-0"
          id="push-notification-toggle"
        >
          {isBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : status === "subscribed" ? (
            <>
              <BellOff className="size-4" />
              <span className="hidden sm:inline ml-1.5">Disable</span>
            </>
          ) : (
            <>
              <Bell className="size-4" />
              <span className="hidden sm:inline ml-1.5">Enable</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
