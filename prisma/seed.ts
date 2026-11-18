import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.auditLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.dailyRecord.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.tenantMembership.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  const adminPasswordHash = await bcrypt.hash("admin12345", 10);

  // 1. Create Superadmin / Business Owner
  const superadmin = await prisma.user.create({
    data: {
      name: "Arthur Sterling (Owner)",
      email: "admin@business.com",
      passwordHash: adminPasswordHash,
      role: "SUPERADMIN",
      status: "ACTIVE",
    },
  });
  console.log("✓ Created Superadmin:", superadmin.email);

  // 2. Create Clients (Tenants)
  const tenantsData = [
    {
      name: "Apex Retail Hub",
      slug: "apex-retail",
      contactEmail: "ops@apexretail.com",
      contactPhone: "+1 (555) 234-5678",
      platformFeePercent: 10.0,
      currency: "USD",
      adminUser: {
        name: "Alex Rivera",
        email: "alex@apex.com",
      },
    },
    {
      name: "Nexus Cloud & AI Solutions",
      slug: "nexus-cloud",
      contactEmail: "finance@nexuscloud.io",
      contactPhone: "+1 (555) 345-6789",
      platformFeePercent: 12.5,
      currency: "USD",
      adminUser: {
        name: "Sarah Chen",
        email: "sarah@nexus.com",
      },
    },
    {
      name: "Vanguard Global Freight",
      slug: "vanguard-freight",
      contactEmail: "accounting@vanguardfreight.com",
      contactPhone: "+1 (555) 456-7890",
      platformFeePercent: 8.0,
      currency: "USD",
      adminUser: {
        name: "Victor Vance",
        email: "victor@vanguard.com",
      },
    },
  ];

  // Generate historical dates (last 7 days)
  const dates: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  for (const tData of tenantsData) {
    const tenant = await prisma.tenant.create({
      data: {
        name: tData.name,
        slug: tData.slug,
        contactEmail: tData.contactEmail,
        contactPhone: tData.contactPhone,
        platformFeePercent: tData.platformFeePercent,
        currency: tData.currency,
      },
    });

    const clientUser = await prisma.user.create({
      data: {
        name: tData.adminUser.name,
        email: tData.adminUser.email,
        passwordHash: defaultPasswordHash,
        role: "CLIENT_USER",
        status: "ACTIVE",
      },
    });

    await prisma.tenantMembership.create({
      data: {
        userId: clientUser.id,
        tenantId: tenant.id,
        role: "CLIENT_ADMIN",
      },
    });

    console.log(`✓ Created Tenant ${tenant.name} with user ${clientUser.email}`);

    // Create Daily Business Records
    for (let dayIdx = 0; dayIdx < dates.length; dayIdx++) {
      const date = dates[dayIdx];
      // Seed realistic variable numbers
      const multiplier = (dayIdx + 1) * 0.8 + Math.random() * 0.4;
      let baseSales = 2800 * multiplier;
      let baseCogs = baseSales * 0.42;
      let baseOpex = 450 + Math.random() * 200;

      if (tenant.slug === "nexus-cloud") {
        baseSales = 4200 * multiplier;
        baseCogs = baseSales * 0.25; // Software margins
        baseOpex = 800 + Math.random() * 300;
      } else if (tenant.slug === "vanguard-freight") {
        baseSales = 5500 * multiplier;
        baseCogs = baseSales * 0.55; // Logistics costs
        baseOpex = 600 + Math.random() * 250;
      }

      const grossSales = Number(baseSales.toFixed(2));
      const cogs = Number(baseCogs.toFixed(2));
      const operatingExpenses = Number(baseOpex.toFixed(2));
      const platformFee = Number(((grossSales * tenant.platformFeePercent) / 100).toFixed(2));
      const netProfit = Number((grossSales - (cogs + operatingExpenses + platformFee)).toFixed(2));
      const marginPercentage = Number(((netProfit / grossSales) * 100).toFixed(2));

      const dailyRecord = await prisma.dailyRecord.create({
        data: {
          tenantId: tenant.id,
          date,
          grossSales,
          cogs,
          operatingExpenses,
          platformFee,
          netProfit,
          marginPercentage,
          notes: `Administrative daily settlement for ${date}`,
          status: "RECORDED",
        },
      });

      // Add individual transactions for client data manipulation
      await prisma.transaction.createMany({
        data: [
          {
            tenantId: tenant.id,
            dailyRecordId: dailyRecord.id,
            type: "REVENUE",
            category: "Sales",
            description: `Channel Direct Revenue Batch #${dayIdx + 1}`,
            amount: Number((grossSales * 0.7).toFixed(2)),
            paymentStatus: "COMPLETED",
            date,
            createdById: clientUser.id,
          },
          {
            tenantId: tenant.id,
            dailyRecordId: dailyRecord.id,
            type: "REVENUE",
            category: "Sales",
            description: `Wholesale & Online Settlements`,
            amount: Number((grossSales * 0.3).toFixed(2)),
            paymentStatus: "COMPLETED",
            date,
            createdById: clientUser.id,
          },
          {
            tenantId: tenant.id,
            dailyRecordId: dailyRecord.id,
            type: "EXPENSE",
            category: "Inventory",
            description: `Restocking & Supplier Invoice`,
            amount: cogs,
            paymentStatus: "COMPLETED",
            date,
            createdById: clientUser.id,
          },
          {
            tenantId: tenant.id,
            dailyRecordId: dailyRecord.id,
            type: "EXPENSE",
            category: "Ad Spend",
            description: `Marketing & Digital Campaigns`,
            amount: Number((operatingExpenses * 0.6).toFixed(2)),
            paymentStatus: "COMPLETED",
            date,
            createdById: clientUser.id,
          },
          {
            tenantId: tenant.id,
            dailyRecordId: dailyRecord.id,
            type: "EXPENSE",
            category: "Shipping",
            description: `Logistics & Fulfillment charges`,
            amount: Number((operatingExpenses * 0.4).toFixed(2)),
            paymentStatus: "COMPLETED",
            date,
            createdById: clientUser.id,
          },
        ],
      });
    }

    // Add sample products for inventory features
    await prisma.product.createMany({
      data: [
        {
          tenantId: tenant.id,
          sku: `SKU-${tenant.slug.substring(0, 3).toUpperCase()}-101`,
          name: "Standard Package / Unit A",
          category: "Tier 1",
          costPrice: 45.0,
          sellingPrice: 120.0,
          stockQty: 85,
          status: "ACTIVE",
        },
        {
          tenantId: tenant.id,
          sku: `SKU-${tenant.slug.substring(0, 3).toUpperCase()}-202`,
          name: "Enterprise Bundle / Unit B",
          category: "Tier 2",
          costPrice: 120.0,
          sellingPrice: 350.0,
          stockQty: 40,
          status: "ACTIVE",
        },
      ],
    });
  }

  console.log("🌱 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
