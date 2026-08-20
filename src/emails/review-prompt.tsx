import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text, Row, Column,
} from "react-email";
import * as React from "react";

interface ReviewPromptEmailProps {
  buyerName: string;
  storeName: string;
  orderNumber: string;
  reviewUrl: string;
}

export function ReviewPromptEmail({ buyerName, storeName, orderNumber, reviewUrl }: ReviewPromptEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>⭐ How was your order from {storeName}?</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ textAlign: "center" }}>
            <Text style={logo}>Ovvi</Text>
          </Section>
          <Section style={heroSection}>
            <Text style={stars}>⭐⭐⭐⭐⭐</Text>
            <Heading style={h1}>How was your order?</Heading>
            <Text style={subtext}>
              Hi {buyerName}, we hope you enjoyed your order <strong>{orderNumber}</strong> from <strong>{storeName}</strong>!
            </Text>
            <Text style={bodyText}>
              Your review helps other customers discover great local bakers and helps {storeName} grow their business. It only takes 30 seconds!
            </Text>
            <Button href={reviewUrl} style={button}>Leave a Review</Button>
          </Section>
          <Hr style={divider} />
          <Text style={footer}>You're receiving this because you recently completed an order on Ovvi.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f8f5f0", fontFamily: "'Inter', Arial, sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" };
const logo = { fontSize: "24px", fontWeight: "700", color: "#f66b18", margin: "0 0 8px" };
const heroSection = { textAlign: "center" as const, backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px 32px", border: "1px solid #e7e5e4" };
const stars = { fontSize: "36px", margin: "0 0 16px" };
const h1 = { fontSize: "26px", fontWeight: "700", color: "#1c1917", margin: "0 0 16px" };
const subtext = { fontSize: "15px", color: "#57534e", margin: "0 0 12px", lineHeight: "1.6" };
const bodyText = { fontSize: "14px", color: "#78716c", margin: "0 0 24px", lineHeight: "1.7" };
const divider = { borderColor: "#e7e5e4", margin: "32px 0 16px" };
const button = { backgroundColor: "#f66b18", color: "#ffffff", padding: "14px 32px", borderRadius: "8px", fontWeight: "600", fontSize: "15px", textDecoration: "none", display: "inline-block" };
const footer = { fontSize: "12px", color: "#a8a29e", textAlign: "center" as const };
