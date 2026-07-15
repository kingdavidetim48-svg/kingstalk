"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ManualPaymentFormProps {
  planId: string;
  onSuccess?: () => void;
}

export function ManualPaymentForm({
  planId,
  onSuccess,
}: ManualPaymentFormProps) {
  const trpc = useTRPC();
  const [file, setFile] = useState<File | null>(null);
  const [senderName, setSenderName] = useState("");
  const [senderAccountNumber, setSenderAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: instructions } = useQuery(
    trpc.manualPayments.getPaymentInstructions.queryOptions({ planId }),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Payment proof is required");
      return;
    }

    if (!senderName || !senderAccountNumber || !bankName) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!instructions) {
      toast.error("Payment instructions are still loading");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("planId", planId);
      formData.append("senderName", senderName);
      formData.append("senderAccountNumber", senderAccountNumber);
      formData.append("bankName", bankName);
      if (reference) formData.append("reference", reference);
      formData.append("paymentReference", instructions.paymentReference);
      formData.append("proofFile", file);

      const response = await fetch("/api/manual-payments/submit", {
        method: "POST",
        headers: {
          "x-kingstalk-action": "manual-payment-submit",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit payment");
      }

      toast.success("Payment submitted successfully", {
        description:
          "Your payment is being reviewed. You'll be notified once approved.",
      });

      setSenderName("");
      setSenderAccountNumber("");
      setBankName("");
      setReference("");
      setFile(null);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to submit payment", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Maximum file size is 5MB",
        });
        return;
      }
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(selectedFile.type)
      ) {
        toast.error("Invalid file type", {
          description: "Only JPEG, PNG, and WebP images are allowed",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  if (!instructions) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Payment</CardTitle>
        <CardDescription>
          Transfer the amount to the bank account below and upload proof of
          payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Instructions */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Account Name:</span>
                <span className="font-mono">{instructions.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Account Number:</span>
                <span className="font-mono">{instructions.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Bank Name:</span>
                <span className="font-mono">{instructions.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Amount:</span>
                <span className="font-mono font-bold">
                  NGN {(instructions.amount / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Plan:</span>
                <span className="font-mono">{instructions.planName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium">Payment Reference:</span>
                <span className="break-all text-right font-mono">
                  {instructions.paymentReference}
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senderName">Sender Name *</Label>
            <Input
              id="senderName"
              placeholder="Name on the bank account"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderAccountNumber">Sender Account Number *</Label>
            <Input
              id="senderAccountNumber"
              placeholder="Account number you're paying from"
              value={senderAccountNumber}
              onChange={(e) => setSenderAccountNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              placeholder="Name of your bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference (Optional)</Label>
            <Input
              id="reference"
              placeholder="Transaction reference from your bank"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proofFile">Payment Proof *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="proofFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a transfer receipt screenshot as JPEG, PNG, or WebP (Max
              5MB)
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !file}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Payment Proof
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
