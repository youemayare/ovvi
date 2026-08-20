import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "react-email";
import * as React from "react";

interface OrderStatusEmailProps {
  buyerName: string;
  storeName: string;
  orderNumber: string;
  status: string;
  orderUrl: string;
}

const STATUS_COPY: Record<string, { emoji: string; title: string; body: string }> = {
  IN_PROGRESS: {
    emoji: "👩‍🍳",
    title: "Your order is being prepared!",
    body: "Great news — the baker has started working on your order. We'll let you know when it's ready.",
  },
  READY: {
    emoji: "🎉",
    title: "Your order is ready!",
    body: "Your order is ready and waiting for you. Head over to pick it up at your convenience.",
  },
  COMPLETED: {
    emoji: "✅",
    title: "Order completed — enjoy!",
    body: "Your order has been marked as completed. We hope you loved every bite! You can now leave a review.",
  },
  CANCELLED: {
    emoji: "❌",
    title: "Order cancelled",
    body: "Unfortunately, your order has been cancelled. If you paid online, a refund will be processed within 5–7 business days.",
  },
};

export function OrderStatusEmail({
  buyerName,
  storeName,
  orderNumber,
  status,
  orderUrl,
}: OrderStatusEmailProps) {
  const copy = STATUS_COPY[status] ?? {
    emoji: "📦",
    title: `Order update — ${status}`,
    body: `Your order ${orderNumber} from ${storeName} has been updated.`,
  };

  return (
    <Html>
      <Head />
      <Preview>{copy.emoji} {copy.title} — {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ textAlign: "center" }}>
            <Text style={logo}>Ovvi</Text>
          </Section>

          <Section style={heroSection}>
            <Text style={emojiStyle}>{copy.emoji}</Text>
            <Heading style={h1}>{copy.title}</Heading>
            <Text style={subtext}>
              Hi {buyerName}, here's an update on your order <strong>{orderNumber}</strong> from {storeName}.
            </Text>
            <Text style={bodyText}>{copy.body}</Text>
          </Section>

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Button href={orderUrl} style={button}>View Order Details</Button>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            Ovvi — The Home Baker Marketplace. Questions? <a href="mailto:hello@ovvi.com" style={{ color: "#f66b18" }}>Contact us</a>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f8f5f0", fontFamily: "'Inter', Arial, sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" };
const logo = { fontSize: "24px", fontWeight: "700", color: "#f66b18", margin: "0 0 8px" };
const heroSection = { textAlign: "center" as const, backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px 32px", border: "1px solid #e7e5e4" };
const emojiStyle = { fontSize: "56px", margin: "0 0 16px" };
const h1 = { fontSize: "26px", fontWeight: "700", color: "#1c1917", margin: "0 0 16px" };
const subtext = { fontSize: "15px", color: "#57534e", margin: "0 0 12px", lineHeight: "1.6" };
const bodyText = { fontSize: "14px", color: "#78716c", margin: "0", lineHeight: "1.7" };
const divider = { borderColor: "#e7e5e4", margin: "32px 0 16px" };
const button = { backgroundColor: "#f66b18", color: "#ffffff", padding: "14px 32px", borderRadius: "8px", fontWeight: "600", fontSize: "15px", textDecoration: "none", display: "inline-block" };
const footer = { fontSize: "12px", color: "#a8a29e", textAlign: "center" as const, lineHeight: "1.6" };
