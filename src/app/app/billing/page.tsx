"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Building, Upload, Check, Loader2, CreditCard } from "lucide-react";

function BillingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("planId") ?? "starter";
  const trpc = useTRPC();

  const { data: plans, isLoading: plansLoading, isError: plansError } = useQuery(trpc.billing.listPlans.queryOptions());
  const { data: bankDetails } = useQuery(trpc.billing.getBankDetails.queryOptions());
  const plan = plans?.find((p) => p.id === planId);

  const [step, setStep] = useState<"details" | "form" | "submitting" | "success">("details");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [proofKey, setProofKey] = useState("");
  const [uploading, setUploading] = useState(false);

  const submitMutation = useMutation(
    trpc.billing.submitPayment.mutationOptions({
      onSuccess: () => {
        setStep("success");
        toast.success("Payment submitted successfully!");
      },
      onError: (err) => {
        toast.error(err.message);
        setStep("form");
      },
    }),
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast.error("Invalid file type. Allowed: jpg, jpeg, png, webp, pdf");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/proof", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProofKey(data.key);
      toast.success("Proof uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!accountName || !bankName || !transferReference || !proofKey) {
      toast.error("Please fill all fields and upload proof");
      return;
    }
    setStep("submitting");
    submitMutation.mutate({ planId, accountName, bankName, transferReference, proofImageKey: proofKey });
  };

  if (plansLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (plansError || !plan) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Plan not found.</p>
        <Button variant="outline" onClick={() => router.push("/app")}>Back to Dashboard</Button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="size-8 text-emerald-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Payment Submitted!</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Your payment for the <strong>{plan.name}</strong> plan is pending verification.
          Check your payment status for updates.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => router.push("/app")}>Back to Dashboard</Button>
          <Button onClick={() => router.push("/app/payments")}>View Status</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button onClick={() => router.push("/app")} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Subscribe to {plan.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">${plan.price / 100}/month &middot; {plan.monthlyCharacterLimit.toLocaleString()} chars/mo</p>
      </div>

      {/* Steps indicator */}
      <div className="mb-8 flex items-center gap-2">
        {["Transfer", "Upload Proof", "Submit"].map((label, i) => {
          const idx = i + 1;
          const active = step === "details" && idx === 1 || step === "form" && idx === 2 || step === "submitting" && idx >= 2;
          const done: boolean = idx < 2 || (step as string) === "success";
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${done ? "bg-emerald-500/15 text-emerald-400" : active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {done ? <Check className="size-3" /> : <span>{idx}</span>}
                {label}
              </div>
              {idx < 3 && <div className="h-px w-8 bg-border" />}
            </div>
          );
        })}
      </div>

      {step === "details" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/50 bg-card/70 p-6 premium-shadow">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Building className="size-5 text-primary" /> Bank Transfer Details
            </h2>
            <div className="space-y-3">
              {[
                { label: "Bank", value: bankDetails?.bankName ?? "..." },
                { label: "Account Name", value: bankDetails?.accountName ?? "..." },
                { label: "Account Number", value: bankDetails?.accountNumber ?? "..." },
                { label: "Amount", value: `$${plan.price / 100}.00` },
                { label: "Plan", value: plan.name },
              ].map((row) => (
                <div key={row.label} className="flex justify-between rounded-lg bg-accent/30 p-3">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className={`text-sm font-medium text-foreground ${row.label === "Account Number" ? "font-mono" : ""}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Instructions:</strong> Log into your mobile banking app or internet banking,
              make a transfer of <strong>${plan.price / 100}.00</strong> to the account above,
              then save the transaction reference or receipt.
            </p>
          </div>

          <Button size="lg" className="w-full" onClick={() => setStep("form")}>
            I&apos;ve Made the Transfer <CreditCard className="ml-2 size-4" />
          </Button>
        </div>
      )}

      {step === "form" && (
        <div className="space-y-5">
          <div className="space-y-4 rounded-xl border border-border/50 bg-card/70 p-6 premium-shadow">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Account Name Used for Transfer</label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Your Bank Name</label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Guaranty Trust Bank" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Transfer Reference</label>
              <Input value={transferReference} onChange={(e) => setTransferReference(e.target.value)} placeholder="Transaction reference from your bank" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Upload Proof of Payment</label>
              <div className="flex items-center gap-3">
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 ${proofKey ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}>
                  <Upload className="size-4" />
                  {proofKey ? "Re-upload" : "Choose file"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
                {uploading && <Loader2 className="size-4 animate-spin" />}
                {proofKey && !uploading && <Check className="size-4 text-emerald-500" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, or PDF. Max 10MB.</p>
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={handleSubmit} disabled={submitMutation.isPending || !proofKey}>
            {submitMutation.isPending ? (
              <><Loader2 className="mr-2 size-4 animate-spin" /> Submitting...</>
            ) : (
              "Submit Payment"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
