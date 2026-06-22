import { env } from "./env";

const PAYSTACK_API = "https://api.paystack.co";

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface InitializeParams {
  email: string;
  amount: number;
  plan: string;
  callback_url: string;
  metadata: Record<string, unknown>;
}

interface InitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface VerifyData {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string;
  plan: { id: number; name: string; plan_code: string } | null;
  metadata: Record<string, unknown>;
  customer: { id: number; email: string; customer_code: string };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<PaystackResponse<T>> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok || !json.status) {
    throw new Error(`Paystack error: ${json.message}`);
  }

  return json as PaystackResponse<T>;
}

export const paystack = {
  transaction: {
    initialize: (params: InitializeParams) =>
      request<InitializeData>("POST", "/transaction/initialize", params),

    verify: (reference: string) =>
      request<VerifyData>("GET", `/transaction/verify/${reference}`),
  },

  verifyWebhook(signature: string, body: string): boolean {
    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");
    return hash === signature;
  },
};
