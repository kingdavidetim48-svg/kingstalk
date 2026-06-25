"use client";

import { AdminPaymentsDashboard } from "@/features/admin/components/admin-payments-dashboard";

export default function AdminPaymentsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage manual payment submissions</p>
      </div>
      <AdminPaymentsDashboard />
    </div>
  );
}
