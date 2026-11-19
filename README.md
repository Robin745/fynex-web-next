# FYNEX | Business Operations Platform

**FYNEX** is a multi-tenant business operations and client intelligence platform built with **Next.js 16 (App Router)**, **React 19**, **Prisma ORM**, and **Tailwind CSS**.

The platform provides a unified operations hub where central business administration records daily client metrics and tracks calculations and fee earnings, while clients operate inside isolated, secure workspaces with self-serve data tools (dollar trade management, CSV import/export, and settlement tracking).

---

## ⚡ Tech Stack

- **Framework**: Next.js 16.4.6 (App Router, Turbopack)
- **Language**: TypeScript 5
- **UI & Styling**: React 19.3.0, Tailwind CSS 4.3.3, Lucide Icons
- **Database**: PostgreSQL (Neon Serverless / Cloud or Local) with Prisma 6.19.3
- **Authentication**: JWT session tokens via `jose`, password hashing via `bcryptjs`
- **Data Tools**: PapaParse (CSV client-side parser & exporter), Recharts

---

## 🚀 Quickstart Guide for Developers

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Robin745/fynex-web-next.git
cd fynex-web-next
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root (ignored by Git) and add your PostgreSQL database connection string and a secret key:

```env
DATABASE_URL="postgresql://<username>:<password>@<neon-hostname>/neondb?sslmode=require"
JWT_SECRET="your-development-jwt-secret-key-32chars"
```

> [!TIP]
> Need a free PostgreSQL database or want to run locally with Docker? Follow our complete **[Database Setup Guide](docs/DATABASE_SETUP.md)**.
> A fallback `.env.development` file is also included in the repository with default template keys. Adding `.env.local` allows you to connect to your personal Neon or local database without committing your private credentials.

### 3. Initialize Database & Seed Demo Data
Push the Prisma schema to your database and seed it with demo admin and client accounts:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Demo Credentials

Use the **1-Click Test Role Switcher** on the `/login` page, or sign in manually with these accounts:

| Role | Email | Password | Workspace |
| :--- | :--- | :--- | :--- |
| **👑 Business Owner / Superadmin** | `admin@business.com` | `admin12345` | `/admin` (Central Hub) |
| **🏢 Client 1: Robin Tech (Exporter)** | `robin@robintech.com` | `password123` | `/portal/robin-tech` |
| **🏢 Client 2: Rigan Travels (Importer)** | `rigan@rigantravels.com` | `password123` | `/portal/rigan-travels` |
| **🏢 Client 3: Rasel Atia (Dual Trader)** | `rasel@raselatia.com` | `password123` | `/portal/rasel-atia` |

---

## 🌐 Production Deployment (Netlify)

The project is preconfigured for continuous deployment on **Netlify**.

### Required Environment Variables on Netlify:
In your Netlify Dashboard (**Site configuration** > **Environment variables**), add:
1. `DATABASE_URL`: Your pooled cloud database connection string (e.g., from Neon).
2. `JWT_SECRET`: A secure, private random 32+ character string used to sign production session cookies.

### Build Command:
```bash
npm run build
```
*(Executes `prisma generate && next build`)*

---

## ✨ Key Features

- **Multi-Tenant Role-Based Access Control (RBAC)**: Strict tenant isolation ensuring each client can only view and modify their own organization's data.
- **Central Batch Ledger (`/admin/entry`)**: Administrative entry sheet for daily business metrics (Sales, COGS, OpEx, Platform Fees, Net Profit, and Margin %).
- **Executive Dashboard (`/admin`)**: Real-time aggregated financial KPIs and per-client profit breakdowns.
- **FX / Dollar Trade Management (`/portal/[slug]/trades`)**: Complete ledger for BUY_USD / SELL_USD operations, rate tracking, and settlement tracking in local currency.
- **Client Transaction Tools (`/portal/[slug]/transactions`)**: Full CRUD transaction ledger, type/category filters, real-time search, CSV export, and bulk CSV import.
- **Product & Inventory Catalog (`/portal/[slug]/inventory`)**: SKU management, unit profit margin tracking, and inventory valuation.

---

## 🧪 Testing & Verification

Run automated calculation and tenant isolation tests:
```bash
npx tsx scripts/test-verification.ts
```

Build for production:
```bash
npm run build
```
