"use client";

import { useMemo, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle,
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Payment = RouterOutputs["adminPayments"]["getAllPayments"][number];
type PaymentStatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED";
type SortMode = "newest" | "oldest" | "amount-high" | "amount-low";

const statusLabels: Record<Exclude<PaymentStatusFilter, "all">, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function getStatusBadge(status: Payment["status"]) {
  if (status === "APPROVED")
    return <Badge className="bg-emerald-600">Approved</Badge>;
  if (status === "REJECTED")
    return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

function formatMoney(amount: number) {
  return `NGN ${(amount / 100).toLocaleString()}`;
}

export function AdminPaymentsDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const paymentInput = useMemo(
    () => ({
      status: statusFilter === "all" ? undefined : statusFilter,
      planId: planFilter === "all" ? undefined : planFilter,
      search: searchQuery || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort: sortMode,
    }),
    [dateFrom, dateTo, planFilter, searchQuery, sortMode, statusFilter],
  );

  const { data: payments, isLoading } = useQuery({
    ...trpc.adminPayments.getAllPayments.queryOptions(paymentInput),
    refetchInterval: 30000,
  });
  const { data: stats } = useQuery(trpc.adminPayments.getStats.queryOptions());
  const { data: plans } = useQuery(trpc.billing.listPlans.queryOptions());

  const invalidatePayments = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.adminPayments.getAllPayments.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.adminPayments.getStats.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.billing.getStatus.queryKey(),
    });
  };

  const approveMutation = useMutation(
    trpc.adminPayments.approvePayment.mutationOptions({
      onSuccess: () => {
        toast.success("Payment approved and subscription activated");
        setSelectedPayment(null);
        setAdminNote("");
        invalidatePayments();
      },
      onError: (error: any) =>
        toast.error("Failed to approve payment", {
          description: error.message,
        }),
    }),
  );

  const rejectMutation = useMutation(
    trpc.adminPayments.rejectPayment.mutationOptions({
      onSuccess: () => {
        toast.success("Payment rejected");
        setSelectedPayment(null);
        setRejectionReason("");
        invalidatePayments();
      },
      onError: (error: any) =>
        toast.error("Failed to reject payment", { description: error.message }),
    }),
  );

  const noteMutation = useMutation(
    trpc.adminPayments.addNote.mutationOptions({
      onSuccess: () => {
        toast.success("Admin note saved");
        setAdminNote("");
        invalidatePayments();
      },
      onError: (error: any) =>
        toast.error("Failed to save note", { description: error.message }),
    }),
  );

  const deleteMutation = useMutation(
    trpc.adminPayments.deleteInvalid.mutationOptions({
      onSuccess: () => {
        toast.success("Invalid submission deleted");
        setSelectedPayment(null);
        setDeleteReason("");
        invalidatePayments();
      },
      onError: (error: any) =>
        toast.error("Failed to delete submission", {
          description: error.message,
        }),
    }),
  );

  const exportMutation = useMutation(
    trpc.adminPayments.exportPayments.mutationOptions({
      onSuccess: (data: any) => {
        const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = data.filename;
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success("Payment export downloaded");
      },
      onError: (error: any) =>
        toast.error("Failed to export payments", {
          description: error.message,
        }),
    }),
  );

  const rows = payments ?? [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
        <MetricCard title="Total Payments" value={stats?.total ?? 0} />
        <MetricCard
          title="Pending"
          value={stats?.pending ?? 0}
          tone="text-amber-600"
        />
        <MetricCard
          title="Approved"
          value={stats?.approved ?? 0}
          tone="text-emerald-600"
        />
        <MetricCard
          title="Rejected"
          value={stats?.rejected ?? 0}
          tone="text-destructive"
        />
        <MetricCard
          title="Revenue"
          value={formatMoney(stats?.totalRevenue ?? 0)}
          className="col-span-2 md:col-span-1"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <NativeSelect
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as PaymentStatusFilter)
          }
        >
          <NativeSelectOption value="all">All statuses</NativeSelectOption>
          <NativeSelectOption value="PENDING">Pending</NativeSelectOption>
          <NativeSelectOption value="APPROVED">Approved</NativeSelectOption>
          <NativeSelectOption value="REJECTED">Rejected</NativeSelectOption>
        </NativeSelect>
        <NativeSelect
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <NativeSelectOption value="all">All plans</NativeSelectOption>
          {plans?.map((plan: any) => (
            <NativeSelectOption key={plan.id} value={plan.id}>
              {plan.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="Date from"
          className="min-w-0"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="Date to"
          className="min-w-0"
        />
        <NativeSelect
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
        >
          <NativeSelectOption value="newest">Newest</NativeSelectOption>
          <NativeSelectOption value="oldest">Oldest</NativeSelectOption>
          <NativeSelectOption value="amount-high">
            High-&gt;Low
          </NativeSelectOption>
          <NativeSelectOption value="amount-low">
            Low-&gt;High
          </NativeSelectOption>
        </NativeSelect>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportMutation.mutate({
              status: paymentInput.status,
              planId: paymentInput.planId,
              search: paymentInput.search,
            })
          }
          disabled={exportMutation.isPending}
        >
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg">Payments</CardTitle>
          <CardDescription>
            Review bank-transfer submissions and manage subscription activation.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">User</TableHead>
                    <TableHead className="whitespace-nowrap hidden sm:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="whitespace-nowrap hidden md:table-cell">
                      User ID
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Plan</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap hidden md:table-cell">
                      Submitted
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground"
                      >
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.userName}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {payment.userEmail}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-40 truncate font-mono text-xs">
                          {payment.userId}
                        </TableCell>
                        <TableCell>{payment.plan.name}</TableCell>
                        <TableCell>{formatMoney(payment.amount)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(payment.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setAdminNote(payment.adminNote ?? "");
                              setRejectionReason("");
                              setDeleteReason("");
                            }}
                            aria-label={`View payment ${payment.paymentReference ?? payment.id}`}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selectedPayment !== null}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl mx-2 sm:mx-auto">
          {selectedPayment && (
            <>
              <DialogHeader>
                <DialogTitle>Payment Details</DialogTitle>
                <DialogDescription>
                  {selectedPayment.paymentReference ?? selectedPayment.id} -{" "}
                  {(statusLabels as any)[selectedPayment.status]}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1 space-y-4">
                  <DetailGrid payment={selectedPayment} />
                  {selectedPayment.proofImageUrl ? (
                    <div>
                      <Label>Uploaded Proof</Label>
                      <div className="mt-2 overflow-hidden rounded-md border bg-muted/20">
                        <img
                          src={selectedPayment.proofImageUrl}
                          alt="Payment proof"
                          className="max-h-80 w-full object-contain sm:max-h-96"
                        />
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        Payment proof could not be loaded.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="w-full lg:w-80 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminNote">Admin notes</Label>
                    <Textarea
                      id="adminNote"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={4}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        noteMutation.mutate({
                          paymentId: selectedPayment.id,
                          note: adminNote,
                        })
                      }
                      disabled={!adminNote.trim() || noteMutation.isPending}
                    >
                      Save Note
                    </Button>
                  </div>
                  {selectedPayment.status === "PENDING" && (
                    <div className="space-y-3 rounded-md border p-3">
                      <Button
                        className="w-full"
                        onClick={() =>
                          approveMutation.mutate({
                            paymentId: selectedPayment.id,
                            adminNotes: adminNote || undefined,
                          })
                        }
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Payment
                      </Button>
                      <div className="space-y-2">
                        <Label htmlFor="rejectionReason">
                          Rejection reason
                        </Label>
                        <Textarea
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                        />
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() =>
                            rejectMutation.mutate({
                              paymentId: selectedPayment.id,
                              rejectionReason,
                              adminNotes: adminNote || undefined,
                            })
                          }
                          disabled={
                            !rejectionReason.trim() || rejectMutation.isPending
                          }
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject Payment
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedPayment.status !== "APPROVED" && (
                    <div className="space-y-2 rounded-md border p-3">
                      <Label htmlFor="deleteReason">
                        Delete invalid submission
                      </Label>
                      <Textarea
                        id="deleteReason"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        rows={3}
                      />
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() =>
                          deleteMutation.mutate({
                            paymentId: selectedPayment.id,
                            reason: deleteReason,
                          })
                        }
                        disabled={
                          !deleteReason.trim() || deleteMutation.isPending
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  )}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      Previous actions
                    </h3>
                    <div className="space-y-2">
                      {selectedPayment.auditLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No admin actions yet.
                        </p>
                      ) : (
                        selectedPayment.auditLogs.map((log: any) => (
                          <div
                            key={log.id}
                            className="rounded-md border p-3 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold capitalize">
                                {log.action}
                              </span>
                              <span className="text-muted-foreground">
                                {format(
                                  new Date(log.createdAt),
                                  "MMM d, HH:mm",
                                )}
                              </span>
                            </div>
                            <p className="mt-1 text-muted-foreground">
                              {log.adminEmail}
                            </p>
                            {log.reason && <p className="mt-1">{log.reason}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter showCloseButton />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  title,
  value,
  tone,
  className,
}: {
  title: string;
  value: string | number;
  tone?: string;
  className?: string;
}) {
  return (
    <Card className={className ?? ""}>
      <CardHeader className="p-3 sm:p-4 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className={`text-lg sm:text-2xl font-bold ${tone ?? ""}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailGrid({ payment }: { payment: Payment }) {
  const details = [
    ["User", payment.userName],
    ["Email", payment.userEmail],
    ["User ID", payment.userId],
    ["Plan", payment.plan.name],
    ["Amount", formatMoney(payment.amount)],
    ["Status", (statusLabels as any)[payment.status]],
    ["Submitted", format(new Date(payment.createdAt), "MMM d, yyyy HH:mm")],
    ["Payment Reference", payment.paymentReference ?? "Not set"],
    ["Sender", payment.accountName],
    ["Sender Account", payment.senderAccountNumber],
    ["Bank", payment.bankName],
    ["Bank Reference", payment.transferReference || "Not provided"],
    [
      "Reviewed",
      payment.reviewedAt
        ? format(new Date(payment.reviewedAt), "MMM d, yyyy HH:mm")
        : "Not reviewed",
    ],
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {details.map(([label, value]) => (
        <div key={label} className="rounded-md border p-2 sm:p-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 break-all text-sm font-medium">{value}</p>
        </div>
      ))}
    </div>
  );
}
