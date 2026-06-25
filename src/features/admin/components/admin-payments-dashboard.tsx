"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Eye, Search, Filter, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export function AdminPaymentsDashboard() {
  const trpc = useTRPC();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: payments, isLoading } = useQuery({
    ...trpc.adminPayments.getAllPayments.queryOptions(),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery(trpc.adminPayments.getStats.queryOptions());

  const approveMutation = useMutation(
    trpc.adminPayments.approvePayment.mutationOptions({
      onSuccess: () => {
        toast.success("Payment approved successfully");
        setSelectedPayment(null);
      },
      onError: (error) => {
        toast.error("Failed to approve payment", {
          description: error.message,
        });
      },
    })
  );

  const rejectMutation = useMutation(
    trpc.adminPayments.rejectPayment.mutationOptions({
      onSuccess: () => {
        toast.success("Payment rejected successfully");
        setSelectedPayment(null);
        setIsRejectDialogOpen(false);
        setRejectionReason("");
      },
      onError: (error) => {
        toast.error("Failed to reject payment", {
          description: error.message,
        });
      },
    })
  );

  const filteredPayments = payments?.filter((payment) => {
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter.toUpperCase();
    const matchesSearch =
      searchQuery === "" ||
      payment.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transferReference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = (paymentId: string) => {
    approveMutation.mutate({ paymentId });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    if (selectedPayment) {
      rejectMutation.mutate({
        paymentId: selectedPayment.id,
        rejectionReason,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.approved || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{((stats?.totalRevenue || 0) / 100).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, account, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            Manage manual payment submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.accountName}</div>
                        <div className="text-xs text-muted-foreground">
                          {payment.transferReference || "No reference"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{payment.bankName}</TableCell>
                    <TableCell>{payment.plan.name}</TableCell>
                    <TableCell>₦{payment.amount}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Payment Details</DialogTitle>
                              <DialogDescription>
                                Review payment information and proof
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPayment && (
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label>Account Name</Label>
                                    <p className="font-medium">{selectedPayment.accountName}</p>
                                  </div>
                                  <div>
                                    <Label>Bank Name</Label>
                                    <p className="font-medium">{selectedPayment.bankName}</p>
                                  </div>
                                  <div>
                                    <Label>Reference</Label>
                                    <p className="font-mono">{selectedPayment.transferReference || "N/A"}</p>
                                  </div>
                                  <div>
                                    <Label>Plan</Label>
                                    <p className="font-medium">{selectedPayment.plan.name}</p>
                                  </div>
                                  <div>
                                    <Label>Amount</Label>
                                    <p className="font-bold">₦{selectedPayment.amount}</p>
                                  </div>
                                  <div>
                                    <Label>User ID</Label>
                                    <p className="font-mono text-xs">{selectedPayment.userId}</p>
                                  </div>
                                </div>

                                {selectedPayment.proofImageUrl && (
                                  <div>
                                    <Label>Payment Proof</Label>
                                    <div className="mt-2 rounded-lg border">
                                      <img
                                        src={selectedPayment.proofImageUrl}
                                        alt="Payment proof"
                                        className="max-h-96 w-full object-contain"
                                      />
                                    </div>
                                  </div>
                                )}

                                {selectedPayment.status === "PENDING" && (
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleApprove(selectedPayment.id)}
                                      disabled={approveMutation.isPending}
                                      className="flex-1"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </Button>
                                    <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="destructive"
                                          className="flex-1"
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Reject
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Reject Payment</DialogTitle>
                                          <DialogDescription>
                                            Please provide a reason for rejecting this payment
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <Label>Rejection Reason</Label>
                                            <Textarea
                                              value={rejectionReason}
                                              onChange={(e) => setRejectionReason(e.target.value)}
                                              placeholder="Explain why this payment is being rejected..."
                                              rows={4}
                                            />
                                          </div>
                                          <div className="flex gap-2 justify-end">
                                            <Button
                                              variant="outline"
                                              onClick={() => setIsRejectDialogOpen(false)}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              onClick={handleReject}
                                              disabled={rejectMutation.isPending}
                                            >
                                              {rejectMutation.isPending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              ) : (
                                                <XCircle className="mr-2 h-4 w-4" />
                                              )}
                                              Reject Payment
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                )}

                                {selectedPayment.status === "REJECTED" && (
                                  <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      <strong>Rejection Reason:</strong> {selectedPayment.adminNote}
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
