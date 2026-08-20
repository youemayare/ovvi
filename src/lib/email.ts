/**
 * Email sending service — wraps Resend with all email events.
 * All functions are fire-and-forget safe: they log errors but never throw,
 * so a failed email never breaks an order flow.
 */
import { render } from "react-email";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { NewOrderSellerEmail } from "@/emails/new-order-seller";
import { OrderStatusEmail } from "@/emails/order-status-update";
import { ReviewPromptEmail } from "@/emails/review-prompt";

async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Email] Skipped (no API key): ${subject} → ${to}`);
    return;
  }
  try {
    const html = await render(react);
    const result = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if ((result as any).error) {
      console.error(`[Email] Resend API error sending "${subject}" to ${to}:`, JSON.stringify((result as any).error));
    } else {
      console.log(`[Email] Sent "${subject}" → ${to} (id: ${(result as any).data?.id})`);
    }
  } catch (err) {
    console.error(`[Email] Exception sending "${subject}" to ${to}:`, err);
  }
}

// ─── Order Confirmation (Buyer) ───────────────────────────────────────────────
export async function sendOrderConfirmationBuyer(params: {
  buyerEmail: string;
  buyerName: string;
  storeName: string;
  orderNumber: string;
  orderId: string;
  scheduledDate: string;
  fulfillmentType: "PICKUP" | "DELIVERY";
  paymentMethod: "STRIPE" | "CASH";
  total: number;
  items: { name: string; quantity: number; totalPrice: number }[];
}) {
  await sendEmail({
    to: params.buyerEmail,
    subject: `Order confirmed — ${params.orderNumber}`,
    react: OrderConfirmationEmail({
      buyerName: params.buyerName,
      storeName: params.storeName,
      orderNumber: params.orderNumber,
      scheduledDate: params.scheduledDate,
      fulfillmentType: params.fulfillmentType,
      paymentMethod: params.paymentMethod,
      total: params.total,
      items: params.items,
      orderUrl: `${APP_URL}/buyer/orders/${params.orderId}`,
    }) as React.ReactElement,
  });
}

// ─── New Order Notification (Seller) ─────────────────────────────────────────
export async function sendNewOrderSeller(params: {
  sellerEmail: string;
  sellerName: string;
  storeName: string;
  orderNumber: string;
  orderId: string;
  buyerName: string;
  scheduledDate: string;
  fulfillmentType: "PICKUP" | "DELIVERY";
  paymentMethod: "STRIPE" | "CASH";
  total: number;
  items: { name: string; quantity: number; totalPrice: number }[];
  buyerNotes?: string;
}) {
  await sendEmail({
    to: params.sellerEmail,
    subject: `🎉 New order ${params.orderNumber} — ${params.buyerName}`,
    react: NewOrderSellerEmail({
      sellerName: params.sellerName,
      storeName: params.storeName,
      orderNumber: params.orderNumber,
      buyerName: params.buyerName,
      scheduledDate: params.scheduledDate,
      fulfillmentType: params.fulfillmentType,
      paymentMethod: params.paymentMethod,
      total: params.total,
      items: params.items,
      buyerNotes: params.buyerNotes,
      orderUrl: `${APP_URL}/seller/orders/${params.orderId}`,
    }) as React.ReactElement,
  });
}

// ─── Order Status Update (Buyer) ──────────────────────────────────────────────
export async function sendOrderStatusUpdate(params: {
  buyerEmail: string;
  buyerName: string;
  storeName: string;
  orderNumber: string;
  orderId: string;
  status: string;
}) {
  const subjectMap: Record<string, string> = {
    IN_PROGRESS: `👩‍🍳 Your order is being prepared — ${params.orderNumber}`,
    READY: `🎉 Your order is ready! — ${params.orderNumber}`,
    COMPLETED: `✅ Order completed — ${params.orderNumber}`,
    CANCELLED: `Order cancelled — ${params.orderNumber}`,
  };
  const subject = subjectMap[params.status] ?? `Order update — ${params.orderNumber}`;

  await sendEmail({
    to: params.buyerEmail,
    subject,
    react: OrderStatusEmail({
      buyerName: params.buyerName,
      storeName: params.storeName,
      orderNumber: params.orderNumber,
      status: params.status,
      orderUrl: `${APP_URL}/buyer/orders/${params.orderId}`,
    }) as React.ReactElement,
  });
}

// ─── Review Prompt (Buyer, 24h after completion) ─────────────────────────────
export async function sendReviewPrompt(params: {
  buyerEmail: string;
  buyerName: string;
  storeName: string;
  orderNumber: string;
  orderId: string;
}) {
  await sendEmail({
    to: params.buyerEmail,
    subject: `⭐ How was your order from ${params.storeName}?`,
    react: ReviewPromptEmail({
      buyerName: params.buyerName,
      storeName: params.storeName,
      orderNumber: params.orderNumber,
      reviewUrl: `${APP_URL}/buyer/orders/${params.orderId}`,
    }) as React.ReactElement,
  });
}
