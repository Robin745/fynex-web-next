# Database Setup & Configuration Guide

This guide covers how to set up, configure, and manage the PostgreSQL database for **FYNEX** across local development and production environments.

---

## 🏗️ Architecture Overview

- **Database Engine**: PostgreSQL
- **ORM**: [Prisma 6](https://www.prisma.io/)
- **Recommended Cloud Host**: [Neon](https://neon.tech) (Serverless PostgreSQL with connection pooling)
- **Production Host**: [Netlify](https://www.netlify.com/) (AWS Lambda Serverless Functions)

---

## ⚡ Option 1: Cloud Database with Neon (Recommended)

Neon is the recommended database provider because it offers a generous free tier, scales down to zero when idle, and includes native connection pooling required by Netlify's serverless environment.

### 1. Create a Free Neon Account & Database
1. Go to [neon.tech](https://neon.tech) and sign up (GitHub 1-click login supported).
2. Click **Create Project**:
   - **Name**: `fynex-db` (or your choice)
   - **Region**: Select the region closest to you or your Netlify deployment (e.g. `US East`, `Frankfurt`, `Singapore`).
   - Click **Create Project**.

### 2. Copy the Pooled Connection String
1. On your Neon dashboard, find the **Connection Details** card.
2. Check the **"Pooled connection"** checkbox.
   > [!IMPORTANT]
   > Always use the **pooled** connection string (contains `-pooler` in the host). Serverless functions on Netlify create new connections rapidly, and pooling prevents exhausting database connection limits.
3. Copy the connection string. It will look similar to:
   ```text
   postgresql://username:password@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Configure Local Environment (`.env.local`)
Create a `.env.local` file in your project root (this file is ignored by Git):

```env
DATABASE_URL="postgresql://username:password@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-development-jwt-secret-key-32chars"
```

### 4. Create Tables & Seed Data
Run the following commands in your terminal:
```bash
# Push the Prisma schema to create all tables
npx prisma db push

# Populate demo accounts, tenant organizations, and sample trades
npx tsx prisma/seed.ts
```

---

## 🐳 Option 2: Local PostgreSQL Setup (Docker or Native)

If you prefer running a database entirely on your local machine without cloud services:

### 1. Run PostgreSQL with Docker
```bash
docker run --name fynex-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fynex \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### 2. Configure `.env.local`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fynex?schema=public"
JWT_SECRET="your-development-jwt-secret-key-32chars"
```

### 3. Initialize & Seed
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

---

## 🛠️ Helpful Database Commands

### Visual Database GUI (Prisma Studio)
Prisma provides a built-in visual browser interface to inspect, edit, and delete records:
```bash
npx prisma studio
```
Opens an interactive dashboard at [http://localhost:5555](http://localhost:5555).

### Schema Updates
Whenever you modify [prisma/schema.prisma](file:///home/moshiur/projects/fynex-web-next/prisma/schema.prisma):
```bash
# Update your database structure without creating migration files
npx prisma db push

# Re-generate the Prisma TypeScript client
npx prisma generate
```

### Resetting & Re-seeding
If you want to clear all data and start fresh:
```bash
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

---

## 🌐 Production Deployment (Netlify)

When deploying to Netlify, configure these environment variables in your Netlify Dashboard (**Site configuration** > **Environment variables**):

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Builds, Functions, Runtime | Your Neon **pooled** PostgreSQL connection string. |
| `JWT_SECRET` | All scopes | A secure 32+ character random secret used for production cookies. |

> [!NOTE]
> Mark both variables with **"Contains secret values"** in Netlify to ensure sensitive credentials are not exposed in build logs or UI previews.

---

## ❓ Troubleshooting

### 1. `PrismaClientInitializationError: Can't reach database server`
- Ensure your Neon project is active (not paused or deleted).
- Check that `?sslmode=require` is present at the end of the connection URL.
- Verify your internet connection allows outbound port `5432`.

### 2. `Table does not exist` or Login Fails Immediately
- Your database schema has not been pushed or seeded yet. Run:
  ```bash
  npx prisma db push
  npx tsx prisma/seed.ts
  ```

### 3. `Datasource provider does not match URL protocol`
- Ensure your connection URL starts with `postgresql://` and matches `provider = "postgresql"` in `prisma/schema.prisma`.
