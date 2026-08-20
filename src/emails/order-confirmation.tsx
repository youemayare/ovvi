import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "react-email";
import * as React from "react";

interface OrderConfirmationEmailProps {
  buyerName: string;
  storeName: string;
  orderNumber: string;
  scheduledDate: string;
  fulfillmentType: "PICKUP" | "DELIVERY";
  paymentMethod: "STRIPE" | "CASH";
  total: number; // in cents
  items: { name: string; quantity: number; totalPrice: number }[];
  orderUrl: string;
}

export function OrderConfirmationEmail({
  buyerName,
  storeName,
  orderNumber,
  scheduledDate,
  fulfillmentType,
  paymentMethod,
  total,
  items,
  orderUrl,
}: OrderConfirmationEmailProps) {
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <Html>
      <Head />
      <Preview>Your order {orderNumber} is confirmed — {storeName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Ovvi 🎂</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={checkmark}>✓</Text>
            <Heading style={h1}>Order Confirmed!</Heading>
            <Text style={subtext}>
              Hi {buyerName}, your order from <strong>{storeName}</strong> has been placed successfully.
            </Text>
          </Section>

          {/* Order details */}
          <Section style={card}>
            <Row>
              <Column style={detailCol}>
                <Text style={detailLabel}>Order Number</Text>
                <Text style={detailValue}>{orderNumber}</Text>
              </Column>
              <Column style={detailCol}>
                <Text style={detailLabel}>{fulfillmentType === "PICKUP" ? "Pickup Date" : "Delivery Date"}</Text>
                <Text style={detailValue}>{scheduledDate}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={detailCol}>
                <Text style={detailLabel}>Payment</Text>
                <Text style={detailValue}>{paymentMethod === "CASH" ? "Cash on pickup" : "Paid online"}</Text>
              </Column>
              <Column style={detailCol}>
                <Text style={detailLabel}>Fulfillment</Text>
                <Text style={detailValue}>{fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}</Text>
              </Column>
            </Row>
          </Section>

          {/* Items */}
          <Section style={{ ...card, marginTop: "16px" }}>
            <Text style={sectionTitle}>Your Items</Text>
            <Hr style={divider} />
            {items.map((item, i) => (
              <Row key={i} style={{ marginBottom: "8px" }}>
                <Column>
                  <Text style={itemName}>{item.name} × {item.quantity}</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={itemPrice}>{fmt(item.totalPrice)}</Text>
                </Column>
              </Row>
            ))}
            <Hr style={divider} />
            <Row>
              <Column>
                <Text style={{ ...itemName, fontWeight: "700" }}>Total</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={{ ...itemPrice, fontWeight: "700", fontSize: "18px" }}>{fmt(total)}</Text>
              </Column>
            </Row>
            {paymentMethod === "CASH" && (
              <Section style={cashBanner}>
                <Text style={cashText}>
                  💳 Remember to bring <strong>{fmt(total)}</strong> cash when you pick up your order.
                </Text>
              </Section>
            )}
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: "center", marginTop: "32px" }}>
            <Button href={orderUrl} style={button}>
              Track My Order
            </Button>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            You received this email because you placed an order on Ovvi. Questions?{" "}
            <a href="mailto:hello@ovvi.com" style={{ color: "#f66b18" }}>Contact us</a>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = { backgroundColor: "#f8f5f0", fontFamily: "'Inter', Arial, sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" };
const header = { textAlign: "center" as const, marginBottom: "8px" };
const logo = { fontSize: "24px", fontWeight: "700", color: "#f66b18", margin: "0" };
const heroSection = { textAlign: "center" as const, padding: "32px 0 24px" };
const checkmark = { fontSize: "48px", margin: "0 0 8px" };
const h1 = { fontSize: "28px", fontWeight: "700", color: "#1c1917", margin: "0 0 12px" };
const subtext = { fontSize: "16px", color: "#57534e", margin: "0", lineHeight: "1.6" };
const card = { backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e7e5e4" };
const detailCol = { width: "50%", verticalAlign: "top" as const };
const detailLabel = { fontSize: "11px", color: "#78716c", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: "0 0 4px" };
const detailValue = { fontSize: "15px", fontWeight: "600", color: "#1c1917", margin: "0 0 16px" };
const sectionTitle = { fontSize: "14px", fontWeight: "600", color: "#1c1917", margin: "0 0 12px" };
const divider = { borderColor: "#e7e5e4", margin: "12px 0" };
const itemName = { fontSize: "14px", color: "#1c1917", margin: "0" };
const itemPrice = { fontSize: "14px", color: "#1c1917", margin: "0" };
const cashBanner = { backgroundColor: "#eff6ff", borderRadius: "8px", padding: "12px 16px", marginTop: "16px" };
const cashText = { fontSize: "13px", color: "#1d4ed8", margin: "0" };
const button = { backgroundColor: "#f66b18", color: "#ffffff", padding: "14px 32px", borderRadius: "8px", fontWeight: "600", fontSize: "15px", textDecoration: "none", display: "inline-block" };
const footer = { fontSize: "12px", color: "#a8a29e", textAlign: "center" as const, lineHeight: "1.6" };
