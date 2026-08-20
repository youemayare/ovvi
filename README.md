# Ovvi: E-Commerce Marketplace for Artisan Home Bakers

Ovvi is a full-stack, multi-tenant marketplace that connects local artisan home bakers with customers. It handles product catalogs, availability scheduling, checkout, and automated order lifecycle management.

This project was built to show practical engineering practices, focusing on security, type-safety, background job orchestration, and clean architecture.

## Tech Stack & Architecture

Ovvi uses a modern serverless stack:

- **Framework:** Next.js 16 (App Router) with React Server Components and Server Actions.
- **Database:** Supabase (PostgreSQL) managed via Drizzle ORM.
- **Authentication:** Clerk (Multi-role access for Buyers, Sellers, Admins).
- **Payments:** Stripe (Checkout, Webhooks).
- **Background Jobs:** Upstash QStash and Redis (for order lifecycle workflows and scheduled tasks).
- **Media Storage:** Cloudinary (Signed image uploads).
- **Styling & UI:** Tailwind CSS, Shadcn UI, Framer Motion.

## Key Technical Highlights

### 1. State Machine for Order Lifecycles
Order statuses (e.g., `PENDING_PAYMENT`, `PREPARING`, `READY_FOR_PICKUP`, `COMPLETED`, `REFUNDED`) are strictly managed. Server Actions enforce valid state transitions, preventing race conditions or unauthorized manual overrides. For example, a seller cannot manually force a `REFUNDED` state.

### 2. Durable Background Workflows
Instead of relying on long-running API routes, Ovvi uses Upstash QStash to manage asynchronous workflows.
- Order confirmations, status updates, and review prompts are scheduled and dispatched asynchronously.
- Retry mechanisms ensure no emails or critical webhooks are dropped if a third-party service experiences downtime.

### 3. Security & Access Control
The application implements several security measures:
- **Authentication & Middleware:** Edge middleware enforces Role-Based Access Control (RBAC).
- **Idempotent Webhooks:** Stripe webhooks process events idempotently using conditional database updates to prevent double-crediting.
- **Secure Media:** Cloudinary uploads require short-lived, server-generated signatures, preventing unauthorized asset uploads.
- **Type-Safe Data Access:** Drizzle ORM queries are strictly typed, with explicit `null` checking enforced by the compiler.

### 4. Marketplace Logic
- **Availability Engine:** Sellers can configure weekly recurring schedules (open/close days, daily capacity limits) and specific blackout dates (holidays, vacations).
- **Dynamic Pricing:** Base product prices combined with selectable variants and add-ons are calculated securely on the server to prevent client-side price manipulation.

## Running Locally

### Prerequisites
- Node.js 18+
- Accounts for Supabase, Clerk, Stripe, Upstash, and Cloudinary.

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

## Code Quality & Conventions

- **Strict TypeScript:** Compiled with strict mode enabled.
- **Component Architecture:** Separation of concerns between presentational components and server-side data fetching.
- **Server-Only Code:** Sensitive logic and database interactions are isolated using the `server-only` package to ensure they never leak to the client bundle.
