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

interface NewOrderSellerEmailProps {
  sellerName: string;
  storeName: string;
  orderNumber: string;
  buyerName: string;
  scheduledDate: string;
  fulfillmentType: "PICKUP" | "DELIVERY";
  paymentMethod: "STRIPE" | "CASH";
  total: number;
  items: { name: string; quantity: number; totalPrice: number }[];
  buyerNotes?: string;
  orderUrl: string;
}

export function NewOrderSellerEmail({
  sellerName,
  storeName,
  orderNumber,
  buyerName,
  scheduledDate,
  fulfillmentType,
  paymentMethod,
  total,
  items,
  buyerNotes,
  orderUrl,
}: NewOrderSellerEmailProps) {
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <Html>
      <Head />
      <Preview>🎉 New order {orderNumber} — {buyerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Ovvi</Text>
          </Section>

          <Section style={heroSection}>
            <Text style={bell}>🔔</Text>
            <Heading style={h1}>You have a new order!</Heading>
            <Text style={subtext}>
              <strong>{buyerName}</strong> just placed order <strong>{orderNumber}</strong> from {storeName}.
            </Text>
          </Section>

          <Section style={card}>
            <Row>
              <Column style={detailCol}>
                <Text style={detailLabel}>Customer</Text>
                <Text style={detailValue}>{buyerName}</Text>
              </Column>
              <Column style={detailCol}>
                <Text style={detailLabel}>{fulfillmentType === "PICKUP" ? "Pickup Date" : "Delivery Date"}</Text>
                <Text style={detailValue}>{scheduledDate}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={detailCol}>
                <Text style={detailLabel}>Payment Method</Text>
                <Text style={detailValue}>{paymentMethod === "CASH" ? "Cash on pickup" : "Paid online ✓"}</Text>
              </Column>
              <Column style={detailCol}>
                <Text style={detailLabel}>Fulfillment</Text>
                <Text style={detailValue}>{fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ ...card, marginTop: "16px" }}>
            <Text style={sectionTitle}>Order Items</Text>
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
              <Column><Text style={{ ...itemName, fontWeight: "700" }}>Total</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={{ ...itemPrice, fontWeight: "700", fontSize: "18px" }}>{fmt(total)}</Text>
              </Column>
            </Row>
          </Section>

          {buyerNotes && (
            <Section style={{ ...card, marginTop: "16px", backgroundColor: "#fffbeb" }}>
              <Text style={sectionTitle}>📝 Customer Notes</Text>
              <Text style={{ fontSize: "14px", color: "#44403c", fontStyle: "italic", margin: "0" }}>
                "{buyerNotes}"
              </Text>
            </Section>
          )}

          <Section style={{ textAlign: "center", marginTop: "32px" }}>
            <Button href={orderUrl} style={button}>
              View & Manage Order
            </Button>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            This email was sent to {sellerName} as a notification for your Ovvi store <em>{storeName}</em>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f8f5f0", fontFamily: "'Inter', Arial, sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" };
const header = { textAlign: "center" as const };
const logo = { fontSize: "24px", fontWeight: "700", color: "#f66b18", margin: "0 0 8px" };
const heroSection = { textAlign: "center" as const, padding: "32px 0 24px" };
const bell = { fontSize: "48px", margin: "0 0 8px" };
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
const button = { backgroundColor: "#f66b18", color: "#ffffff", padding: "14px 32px", borderRadius: "8px", fontWeight: "600", fontSize: "15px", textDecoration: "none", display: "inline-block" };
const footer = { fontSize: "12px", color: "#a8a29e", textAlign: "center" as const, lineHeight: "1.6" };
