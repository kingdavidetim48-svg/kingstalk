import "server-only";
import nodemailer from "nodemailer";
import { env } from "./env";
import { sendPushNotification } from "./web-push";
import { logger } from "./logger";

export type NotificationEventType =
  | "SIGN_UP"
  | "LOGIN"
  | "PAYMENT_INITIATED"
  | "PAYMENT_APPROVED";

interface NotificationPayload {
  event: NotificationEventType;
  userName: string;
  userEmail: string;
  timestamp: Date;
  paymentAmount?: number;
  paymentPlan?: string;
  paymentReference?: string;
}

function getEventLabel(event: NotificationEventType): string {
  const labels: Record<NotificationEventType, string> = {
    SIGN_UP: "New User Sign Up",
    LOGIN: "User Login",
    PAYMENT_INITIATED: "Payment Initiated",
    PAYMENT_APPROVED: "Payment Approved",
  };
  return labels[event];
}

function getEmoji(event: NotificationEventType): string {
  const emojis: Record<NotificationEventType, string> = {
    SIGN_UP: "🎉",
    LOGIN: "🔑",
    PAYMENT_INITIATED: "💳",
    PAYMENT_APPROVED: "✅",
  };
  return emojis[event];
}

function formatEmailBody(payload: NotificationPayload): string {
  const lines: string[] = [
    `${getEmoji(payload.event)} ${getEventLabel(payload.event)}`,
    "",
    `User: ${payload.userName}`,
    `Email: ${payload.userEmail}`,
    `Time: ${payload.timestamp.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}`,
  ];

  if (payload.paymentAmount !== undefined) {
    lines.push(`Amount: NGN ${(payload.paymentAmount / 100).toLocaleString()}`);
  }
  if (payload.paymentPlan) {
    lines.push(`Plan: ${payload.paymentPlan}`);
  }
  if (payload.paymentReference) {
    lines.push(`Reference: ${payload.paymentReference}`);
  }

  return lines.join("\n");
}

function formatPushBody(payload: NotificationPayload): string {
  const parts: string[] = [
    `${getEventLabel(payload.event)} - ${payload.userName} (${payload.userEmail})`,
  ];
  if (payload.paymentAmount !== undefined) {
    parts.push(`NGN ${(payload.paymentAmount / 100).toLocaleString()}`);
  }
  if (payload.paymentPlan) {
    parts.push(payload.paymentPlan);
  }
  return parts.join(" | ");
}

export async function sendAdminEmail(
  payload: NotificationPayload,
): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn("SMTP not configured — skipping email notification");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"KingsTalk Admin" <${env.SMTP_USER}>`,
      to: env.ADMIN_EMAIL,
      subject: `${getEmoji(payload.event)} KingsTalk: ${getEventLabel(payload.event)}`,
      text: formatEmailBody(payload),
    });

    logger.info({ event: payload.event, userEmail: payload.userEmail }, "Admin email sent");
  } catch (error) {
    logger.error({ error, event: payload.event }, "Failed to send admin email");
  }
}

export async function notifyAll(
  payload: NotificationPayload,
): Promise<void> {
  await Promise.allSettled([
    sendAdminEmail(payload),
    sendPushNotification({
      title: `KingsTalk: ${getEventLabel(payload.event)}`,
      body: formatPushBody(payload),
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `kingstalk-${payload.event}-${Date.now()}`,
    }),
  ]);
}
