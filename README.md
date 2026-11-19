# FYNEX | Business Operations Platform

**FYNEX** is a multi-tenant business operations and client intelligence platform built with **Next.js 16 (App Router)**, **React 19**, **Prisma ORM**, and **Tailwind CSS**.

The platform provides a unified operations hub where central business administration records daily client metrics and tracks calculations and fee earnings, while clients operate inside isolated, secure workspaces with self-serve data tools (transaction management, CSV import/export, and inventory catalogs).

---

## ⚡ Tech Stack

- **Framework**: Next.js 16.4.6 (App Router, Turbopack)
- **Language**: TypeScript 5
- **UI & Styling**: React 19.3.0, Tailwind CSS 4.3.3, Lucide Icons
- **Database**: SQLite with Prisma 6.19.3
- **Authentication**: JWT session tokens via `jose`, password hashing via `bcryptjs`
- **Data Tools**: PapaParse (CSV client-side parser & exporter)

---

## 🚀 Quickstart Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Robin745/fynex-web-next.git
cd fynex-web-next
npm install
```

### 2. Initialize Database & Seed Demo Data
Default local development variables are preconfigured in `.env.development`. Initialize the database:
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
| **🏢 Client 1: Apex Retail Hub** | `alex@apex.com` | `password123` | `/portal/apex-retail` |
| **🏢 Client 2: Nexus Cloud & AI** | `sarah@nexus.com` | `password123` | `/portal/nexus-cloud` |
| **🏢 Client 3: Vanguard Freight** | `victor@vanguard.com` | `password123` | `/portal/vanguard-freight` |

---

## ✨ Key Features

- **Multi-Tenant Role-Based Access Control (RBAC)**: Strict tenant isolation ensuring each client can only view and modify their own organization's data.
- **Central Batch Ledger (`/admin/entry`)**: Administrative entry sheet for daily business metrics (Sales, COGS, OpEx, Platform Fees, Net Profit, and Margin %).
- **Executive Dashboard (`/admin`)**: Real-time aggregated financial KPIs and per-client profit breakdowns.
- **Collapsible Sidebar**: Compact icon rail (`w-16`) and expanded mode (`w-64`) with keyboard toggle (`Ctrl+B` / `Cmd+B`) and local storage persistence.
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
