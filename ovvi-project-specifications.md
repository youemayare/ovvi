# Project Specification: Ovvi
**A Two-Sided Marketplace and Operating System for Home Bakers & Dessert Sellers**

## 1. Executive Summary
**Vision:** Build the platform where home bakers become real businesses, and where customers naturally go to discover and order local homemade desserts.

**The Problem:** 
Home bakers and cottage-food dessert sellers currently manage their businesses through a fragmented, chaotic mix of Instagram DMs, WhatsApp messages, ad hoc spreadsheets, and manual payment chasing. Buyers, conversely, lack a centralized, trustworthy platform to discover local bakers, compare menus, verify availability, and place orders without engaging in lengthy messaging back-and-forths.

**The Solution:**
Ovvi is a business-enablement platform for sellers and a discovery marketplace for buyers. It provides sellers with a structured operating system (storefronts, order management, scheduling, payments) to eliminate DM-based sales, which organically populates a searchable marketplace where local buyers can order with confidence.

---

## 2. Target Audience & Niche
**The Niche:** Very small, independent, homemade, preorder-driven businesses (custom cakes, dessert boxes, small-batch baked goods) rather than full commercial restaurant chains.

*   **Primary Sellers:** Home bakers, cottage-food businesses, cake decorators, and side-hustle bakers seeking professionalization.
*   **Primary Buyers:** Customers ordering occasion cakes (birthdays, weddings), event planners, and local buyers seeking homemade treats over mass-market bakery options.

---

## 3. Core Product Scope (MVP)

### Seller-Side OS
*   **Onboarding & Profile:** Guided setup for bakery storefront creation, including location and delivery/pickup settings.
*   **Menu Builder:** Product listings with images, variants, and dynamic pricing.
*   **Custom Order Engine:** Configurable request forms specifically designed for custom cakes/bakes.
*   **Availability Engine:** Lead-time settings, blackout dates, and capacity limits (e.g., max 3 custom cakes per weekend).
*   **Order Management Dashboard:** Kanban or list view of orders by status (Pending, Confirmed, In Progress, Ready, Completed).
*   **Financials:** Automated deposit/payment collection and payout routing.

### Buyer-Side Marketplace
*   **Discovery:** Marketplace homepage featuring localized search and filtering (by category, occasion, price, dietary needs, and availability).
*   **Storefront Navigation:** Dedicated, SEO-friendly baker profiles and product detail pages.
*   **Dual Checkout Flows:** 
    *   *Instant Order:* Standard cart-to-checkout flow for fixed-menu items.
    *   *Custom Inquiry:* Request submission flow requiring baker review, quote generation, and subsequent buyer payment.
*   **Account Management:** Order history, status tracking, and post-order reviews.

### Admin-Side (Platform Management)
*   **Moderation:** Review/approve seller accounts and monitor listings/reviews.
*   **Financial Oversight:** Manage platform commission rates and monitor Stripe Connect transaction flows.

---

## 4. Technical Architecture & Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Shadcn UI |
| **Database** | PostgreSQL |
| **Database ORM** | Prisma |
| **Authentication** | Clerk |
| **Payments** | Stripe Connect (Express/Accounts v2) |
| **Media Storage** | Cloudinary |
| **Communications** | Resend + React Email |
| **Background Jobs** | Upstash Workflow |
| **Hosting** | Vercel (Frontend & API) + Neon/Supabase (Database) |

---

## 5. Architectural Reasoning & System Design

**Next.js (App Router) & TypeScript**
The platform requires both highly interactive, state-heavy dashboards (for sellers) and blazingly fast, SEO-optimized public pages (for buyers). Next.js provides Server-Side Rendering (SSR) for the marketplace listings, while TypeScript enforces strict data contracts across the distinct Buyer, Seller, and Admin interfaces, preventing role-based data leaks. API routes will be handled natively via Next.js Route Handlers and Server Actions to maintain a lean MVP architecture.

**PostgreSQL + Prisma**
A two-sided marketplace is inherently relational. An `Order` links a `Buyer`, a `Seller`, `LineItems`, a `PaymentIntent`, and potentially a `Review`. PostgreSQL ensures ACID compliance, preventing critical race conditions (e.g., double-booking a baker's calendar). Prisma accelerates development with a strongly typed schema and intuitive migration system, outperforming NoSQL alternatives for complex transaction mapping.

**Clerk (Identity & RBAC)**
Authentication must handle strict Role-Based Access Control (RBAC). Clerk provides out-of-the-box session management and allows custom metadata assignment (e.g., `role: "seller"`), instantly securing protected routes and separating the marketplace UX from the operational dashboards.

**Stripe Connect**
Managing multi-party escrow, KYC (Know Your Customer) compliance, and tax routing manually is a massive liability. Stripe Connect natively handles seller onboarding, payment capturing, platform fee deductions, and automated bank payouts to the bakers.

**Upstash Workflow (Asynchronous State Machines)**
Standard checkouts are synchronous, but custom cake requests are asynchronous. Upstash Workflow will manage the required background timers—for example, automatically expiring a custom request and notifying the buyer if the seller fails to provide a quote within a 48-hour SLA window.

**Cloudinary**
Food marketplaces are highly visual. High-resolution uploads from sellers will be automatically cropped, compressed, and converted to modern web formats (WebP/AVIF) via Cloudinary's CDN, ensuring the buyer-facing storefront remains highly performant on mobile devices.

---

## 6. Future Scope & Long-Term Vision

### Enhanced Seller Tooling & Operational Scaling
*   **Smart Costing & Inventory Engine:** Ingredient-level inventory tracking and live recipe costing sheets. This will automatically calculate profit margins based on changing supplier prices and flag when an ingredient is running low relative to scheduled production runs.
*   **Automated Prep Lists & Production Calendars:** A centralized production dashboard that aggregates all accepted orders for the week and auto-generates a unified prep list (e.g., total weight of buttercream, number of sponge layers to bake, and decoration timelines broken down by day).
*   **Automated Customer Communication:** Message templates and rule-based reminders via the WhatsApp Business API or SMS, triggering automated updates for "Order Confirmed," "Starting Production," and "Ready for Pickup."

### Advanced Marketplace Discovery
*   **Curated & Seasonal Collections:** Dynamically aggregated collections featuring trending local bakeshops, "Best of Birthday Cakes," and dedicated occasion-based storefront modules for localized events (e.g., Eid, Ramadan, Diwali, National Day, or wedding seasons).
*   **Subscription & Custom Drop Models:** Tools allowing bakers to offer weekly/monthly dessert subscriptions, or host high-demand "Flash Sales" and "Seasonal Drops" where limited-quantity dessert boxes are opened for pre-orders with real-time stock countdowns.
*   **Social & Engagement Layer:** Features allowing buyers to "Follow" or favorite local bakeshops to receive instant push or email notifications whenever a baker launches a new menu, opens up holiday slots, or posts to their gallery.

### Growth, Marketing & The Traffic Layer
*   **Instagram & WhatsApp Lead Capture Tool:** Smart widgets and specialized landing pages that let sellers drop an Ovvi checkout link directly into their Instagram bios or WhatsApp automated replies. This captures chaotic DM traffic and converts it into structured platform orders seamlessly.
*   **Marketing & Creative Asset Engine:** Auto-generation of stylized social media templates, product mockup assets, and print-ready QR code templates for packaging, pulling image assets directly from the baker’s Ovvi digital storefront.
*   **Dynamic Promotion & Loyalty Architecture:** Fine-grained referral programs, group discount engines, and custom promo-code generators designed to incentivize repeat corporate accounts or large family event bookings.

### Trust, Security & Verification
*   **Cottage-Food Compliance Ledger:** Document verification architecture that allows bakers to upload and display local health department permits, food handler certifications, or home-business licenses, earning them a "Verified Safe" badge.
*   **Deep Allergen & Dietary Transparency:** A highly audited ingredient filtering engine with explicit tagging for nuts, gluten, dairy, vegan, and cross-contamination warnings, ensuring extreme reliability for buyers managing severe allergies.
*   **Automated Escrow & Dispute Handling:** A robust mediation dashboard with standardized parameters for custom order cancellations, partial refunds for transport damage, and automated deposit collection guidelines.

---

## 7. Strategic Vision
The long-term vision is to establish **Ovvi** as the default operating infrastructure for independent home dessert businesses globally, while serving as the premier consumer utility for artisanal dessert discovery. By mitigating the friction of back-end logistics—storefront assembly, pricing estimation, invoicing, calendar management, and split payments—Ovvi converts culinary talent into sustainable micro-enterprises. For the consumer, it brings consistency, transparency, and absolute safety to the local, small-batch food ecosystem, rendering the custom ordering experience as seamless and dependable as modern mainline commerce apps.