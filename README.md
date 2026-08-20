# Ovvi – E-Commerce Marketplace for Artisan Home Bakers

Ovvi is a full-stack, multi-tenant e-commerce marketplace built to connect local artisan home bakers with customers. It provides a seamless end-to-end platform handling everything from dynamic product catalogs and availability scheduling to secure checkout and automated order lifecycle management.

This project was built to demonstrate production-ready engineering practices, focusing on **security, type-safety, background job orchestration, and robust architecture**.

## 🚀 Tech Stack & Architecture

Ovvi is built on a modern, serverless stack designed for scale and developer velocity:

- **Framework:** Next.js 16 (App Router) with React Server Components & Server Actions.
- **Database:** Supabase (PostgreSQL) managed via Drizzle ORM.
- **Authentication:** Clerk (Multi-role access: Buyers, Sellers, Admins).
- **Payments:** Stripe (Checkout, Webhooks).
- **Background Jobs:** Upstash QStash & Redis (for durable order lifecycle workflows and scheduled tasks).
- **Media Storage:** Cloudinary (Signed, secure image uploads).
- **Styling & UI:** Tailwind CSS, Shadcn UI, Framer Motion.

## 🎯 Key Technical Highlights

### 1. Robust State Machine for Order Lifecycles
Order statuses (e.g., `PENDING_PAYMENT`, `PREPARING`, `READY_FOR_PICKUP`, `COMPLETED`, `REFUNDED`) are strictly managed. Server Actions enforce valid state transitions, preventing race conditions or unauthorized manual overrides (e.g., a seller cannot manually force a `REFUNDED` state).

### 2. Durable Background Workflows
Instead of relying on fragile long-running API routes, Ovvi uses **Upstash QStash** to orchestrate asynchronous workflows. 
- Order confirmations, status updates, and review prompts are scheduled and dispatched reliably.
- Retry mechanisms ensure no emails or critical webhooks are dropped if a third-party service experiences downtime.

### 3. Security First & Penetration Tested
The application has undergone a rigorous security audit with implemented patches for:
- **Authentication & Middleware:** Strict edge middleware enforcing Role-Based Access Control (RBAC). 
- **Idempotent Webhooks:** Stripe webhooks process events idempotently using conditional database updates to prevent double-crediting.
- **Secure Media:** Cloudinary uploads require short-lived, server-generated signatures—preventing unauthorized asset uploads.
- **Type-Safe Data Access:** Drizzle ORM queries are heavily typed, with explicit `null` checking enforced at the compiler level. 

### 4. Advanced Marketplace Logic
- **Complex Availability Engine:** Sellers can configure weekly recurring schedules (open/close days, daily capacity limits) and specific blackout dates (holidays, vacations).
- **Dynamic Pricing:** Base product prices combined with selectable variants and add-ons are calculated securely on the server to prevent client-side price manipulation.

## ⚙️ Running Locally

### Prerequisites
- Node.js 18+
- Accounts for: Supabase, Clerk, Stripe, Upstash, and Cloudinary.

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ovvi.git
   cd ovvi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Duplicate `.env.example` to `.env.local` and fill in your keys.
   ```bash
   cp .env.example .env.local
   ```

4. **Database Migration:**
   Generate and push the Drizzle schema to your Supabase instance.
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🛡️ Code Quality & Conventions

- **Strict TypeScript:** Compiled with strict mode enabled.
- **Component Architecture:** Separation of concerns between presentational components and server-side data fetching.
- **Server-Only Code:** Sensitive logic and database interactions are isolated using the `server-only` package to guarantee they never leak to the client bundle.

---
*Developed with a focus on modern web engineering standards.*
