"use client";

import { useState } from "react";
import { AdminPaymentsDashboard } from "@/features/admin/components/admin-payments-dashboard";
import { AdminUsersPanel } from "@/features/admin/components/admin-users-panel";
import { PushNotificationManager } from "@/features/admin/components/push-notification-manager";

type Tab = "payments" | "users";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("payments");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Manage payments and users
              </p>
            </div>
            <PushNotificationManager />
          </div>
        </div>

        <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1 sm:w-fit">
          <button
            type="button"
            onClick={() => setTab("payments")}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === "payments"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Payments
          </button>
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === "users"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Users
          </button>
        </div>

        {tab === "payments" ? <AdminPaymentsDashboard /> : <AdminUsersPanel />}
      </div>
    </div>
  );
}
