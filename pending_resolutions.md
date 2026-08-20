# Ovvi — Pending Resolutions

> [!NOTE]
> This is a living document tracking unresolved product and business decisions. Each item lists the options under consideration and the **architectural default** being used in the implementation plan until a final decision is made. These defaults are designed to be swappable without schema rewrites.

---

## 1. Revenue Model on Cash Orders

**Question:** If a buyer pays in cash directly to the baker, Ovvi has no transaction to take a commission from. How does Ovvi monetize cash orders?

**Options:**
- **A.** Ovvi takes NO commission on cash orders — it's a loss-leader to drive adoption. Monetize only on Stripe transactions.
- **B.** Ovvi charges sellers a small flat fee per cash order (e.g., $0.50) billed monthly as a platform usage fee.
- **C.** Cash orders are tracked but Ovvi takes a percentage commission on ALL orders (cash + Stripe), invoiced to the seller monthly.
- **D.** Cash payment option is only available to sellers on a paid subscription tier (free-tier sellers must use Stripe only).

**Architectural Default:** Option A (no commission on cash). The schema will track `paymentMethod: 'STRIPE' | 'CASH'` on every order so commission logic can be layered on later regardless of which model is chosen.

---

## 2. Cash Order No-Show Risk

**Question:** A buyer selects "Pay in Cash," the baker blocks a calendar slot and produces a cake, then the buyer ghosts. What's the mitigation?

**Options:**
- **A.** No mitigation for MVP — accept the risk. Bakers understand this (it's how they already operate via WhatsApp).
- **B.** Require buyers to verify their phone number (OTP) before placing a cash order, creating accountability.
- **C.** Allow bakers to toggle cash on/off per product — they can disable it for high-value custom cakes and only allow it for low-risk standard items.
- **D.** Require a non-refundable Stripe deposit (e.g., 20–30%) even for "cash" orders, with the remainder paid in cash at pickup.

**Architectural Default:** Options A + C. No active mitigation, but the schema will support a `cashEnabled` boolean per product so bakers can control exposure. The order model will also support a `depositAmount` field so Option D can be enabled later without migration.

---

## 3. Platform Commission Rate

**Question:** What commission percentage does Ovvi take on Stripe-processed orders?

**Options:**
- **A.** 5% platform fee (aggressive, adoption-friendly)
- **B.** 8% platform fee (balanced)
- **C.** 10% platform fee (standard marketplace rate)
- **D.** 12–15% platform fee (premium, justified by tools provided)

**Architectural Default:** 10% (stored as an environment variable `PLATFORM_COMMISSION_RATE=0.10`, trivially changeable). Stripe Connect's `application_fee_amount` will be calculated dynamically from this value.

---

## 4. Delivery Scope for MVP

**Question:** How should delivery work at launch?

**Options:**
- **A.** Pickup ONLY for MVP. No delivery support at all — simplifies everything.
- **B.** Pickup + Baker Self-Delivery with a flat delivery fee set by the baker (no radius/zone logic).
- **C.** Pickup + Baker Self-Delivery with zone-based delivery fees (e.g., 0–10km = $X, 10–20km = $Y — baker configures zones).
- **D.** Pickup + Third-party delivery integration (e.g., local courier API).

**Architectural Default:** Option B. The schema will support `fulfillmentType: 'PICKUP' | 'DELIVERY'` on orders and a `deliveryFee` field on the seller profile. Zone-based logic can be layered on later.

---

## 5. Launch Geography

**Question:** Which city/region are you launching in first? This affects currency, locale, Stripe configuration, and distance units.

**Options:**
- **A.** A city in the UAE (AED currency, km distances)
- **B.** A city in Saudi Arabia (SAR currency, km distances)
- **C.** A US metro area (USD currency, mile distances)
- **D.** A UK city (GBP currency, mile distances)
- **E.** Geography-agnostic from day one (multi-currency support)

**Architectural Default:** Geography-agnostic with USD as the default display currency. The schema will store currency codes per seller (`currency: 'USD' | 'AED' | 'SAR' | 'GBP'`) and all monetary values in the smallest unit (cents/fils). Stripe Connect handles multi-currency natively. Distance will be stored in meters (convertible to km or miles in the UI layer).

---

## 6. Custom Quote Link Expiration

**Question:** When a baker generates a checkout link for a custom quote and sends it via WhatsApp, should it expire?

**Options:**
- **A.** Expire after 48 hours. If the buyer doesn't pay, the quote dies and the calendar slot is released.
- **B.** Expire after 72 hours.
- **C.** Let the baker set the expiration window when creating the quote (e.g., 24h, 48h, 72h, 1 week).
- **D.** No expiration — the link stays valid until the baker manually cancels the quote.

**Architectural Default:** Option C with a default of 72 hours. The schema will store `expiresAt: timestamp` on the quote record. Upstash Workflow will schedule an expiration job at quote creation time. The baker can override the default from a dropdown when creating the quote.

---

> [!IMPORTANT]
> **All architectural defaults above are designed to be non-breaking.** The schema accommodates every listed option. Changing a decision later requires only business logic updates — no database migrations.
