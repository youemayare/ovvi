import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("[Resend] RESEND_API_KEY is not set — emails will be skipped.");
}

export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Ovvi <noreply@ovvi.com>";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

