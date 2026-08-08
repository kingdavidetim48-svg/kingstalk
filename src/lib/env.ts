import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    ADMIN_EMAIL: z.string().email().refine((val) => val === "aetim8273@gmail.com", {
      message: "ADMIN_EMAIL must equal aetim8273@gmail.com",
    }),
    BANK_NAME: z.string().optional(),
    BANK_ACCOUNT_NAME: z.string().optional(),
    BANK_ACCOUNT_NUMBER: z.string().optional(),
    CRON_SECRET: z.string().min(1),
    APP_URL: z.string().url(),
    // Flutterwave payment gateway
    FLW_SECRET_KEY: z.string().min(1),
    FLW_WEBHOOK_SECRET_HASH: z.string().min(1),
    // Cloudflare R2
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    // Chatterbox TTS
    CHATTERBOX_API_URL: z.string().url(),
    CHATTERBOX_API_KEY: z.string().min(1),
    HF_ACCESS_TOKEN: z.string().min(1),
    // Email / SMTP
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    // Web Push
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),
    // Clerk webhook
    CLERK_WEBHOOK_SECRET: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
    NEXT_PUBLIC_FLW_PUBLIC_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    BANK_NAME: process.env.BANK_NAME,
    BANK_ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME,
    BANK_ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER,
    CRON_SECRET: process.env.CRON_SECRET,
    APP_URL: process.env.APP_URL,
    FLW_SECRET_KEY: process.env.FLW_SECRET_KEY,
    FLW_WEBHOOK_SECRET_HASH: process.env.FLW_WEBHOOK_SECRET_HASH,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    CHATTERBOX_API_URL: process.env.CHATTERBOX_API_URL,
    CHATTERBOX_API_KEY: process.env.CHATTERBOX_API_KEY,
    HF_ACCESS_TOKEN: process.env.HF_ACCESS_TOKEN,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_FLW_PUBLIC_KEY: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
