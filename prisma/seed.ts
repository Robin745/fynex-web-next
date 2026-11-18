import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Dollar Buy/Sell (FX Operations) seed...");

  // Clear existing records
  await prisma.auditLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.dailyRecord.deleteMany({});
  await prisma.tenantMembership.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  const adminPasswordHash = await bcrypt.hash("admin12345", 10);

  // 1. Create Superadmin / Business Owner
  const superadmin = await prisma.user.create({
    data: {
      name: "Shajeev",
      email: "admin@business.com",
      passwordHash: adminPasswordHash,
      role: "SUPERADMIN",
      status: "ACTIVE",
    },
  });
  console.log("✓ Created Superadmin / Business Owner:", superadmin.name, `(${superadmin.email})`);

  // 2. Fixed Clients (Tenants)
  const fixedClients = [
    {
      name: "Robin Tech",
      slug: "robin-tech",
      contactEmail: "robin@robintech.com",
      contactPhone: "+880 1712-345678",
      clientType: "EXPORTER",
      settlementCurrency: "BDT",
      defaultBuyRate: 121.70, // Admin buys USD from Robin Tech
      defaultSellRate: 122.50,
      platformFeePercent: 0.6,
      adminUser: {
        name: "Robin",
        email: "robin@robintech.com",
      },
    },
    {
      name: "Rigan Travels",
      slug: "rigan-travels",
      contactEmail: "rigan@rigantravels.com",
      contactPhone: "+880 1819-876543",
      clientType: "IMPORTER",
      settlementCurrency: "BDT",
      defaultBuyRate: 122.00,
      defaultSellRate: 123.20, // Admin sells USD to Rigan Travels
      platformFeePercent: 0.8,
      adminUser: {
        name: "Rigan",
        email: "rigan@rigantravels.com",
      },
    },
    {
      name: "Rasel Atia",
      slug: "rasel-atia",
      contactEmail: "rasel@raselatia.com",
      contactPhone: "+880 1911-223344",
      clientType: "DUAL_TRADER",
      settlementCurrency: "BDT",
      defaultBuyRate: 121.80,
      defaultSellRate: 122.90,
      platformFeePercent: 0.7,
      adminUser: {
        name: "Rasel Atia",
        email: "rasel@raselatia.com",
      },
    },
  ];

  // Generate 7 days of historical dates
  const dates: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  let tradeCounter = 1001;

  for (const cData of fixedClients) {
    const tenant = await prisma.tenant.create({
      data: {
        name: cData.name,
        slug: cData.slug,
        contactEmail: cData.contactEmail,
        contactPhone: cData.contactPhone,
        clientType: cData.clientType,
        settlementCurrency: cData.settlementCurrency,
        defaultBuyRate: cData.defaultBuyRate,
        defaultSellRate: cData.defaultSellRate,
        platformFeePercent: cData.platformFeePercent,
        currency: "USD",
      },
    });

    const clientUser = await prisma.user.create({
      data: {
        name: cData.adminUser.name,
        email: cData.adminUser.email,
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

    console.log(`✓ Created Client ${tenant.name} (${clientUser.email})`);

    // Create 7 Days of Dollar Buy/Sell records
    for (let dayIdx = 0; dayIdx < dates.length; dayIdx++) {
      const date = dates[dayIdx];

      // Realistic volumes based on client type
      let usdBought = 0;
      let buyRate = 0;
      let usdSold = 0;
      let sellRate = 0;

      if (tenant.clientType === "EXPORTER") {
        // Exporter primarily sells USD to FynEX (Admin buys USD)
        usdBought = 3500 + (dayIdx * 650);
        buyRate = Number((tenant.defaultBuyRate + (Math.random() * 0.4 - 0.2)).toFixed(2));
        usdSold = dayIdx % 3 === 0 ? 500 : 0; // occasional buyback
        sellRate = usdSold > 0 ? Number((buyRate + 0.90).toFixed(2)) : 0;
      } else if (tenant.clientType === "IMPORTER") {
        // Importer primarily buys USD from FynEX (Admin sells USD)
        usdSold = 5000 + (dayIdx * 800);
        sellRate = Number((tenant.defaultSellRate + (Math.random() * 0.4 - 0.2)).toFixed(2));
        usdBought = dayIdx % 4 === 0 ? 800 : 0;
        buyRate = usdBought > 0 ? Number((sellRate - 0.95).toFixed(2)) : 0;
      } else {
        // Dual client (Buys and sells USD)
        usdBought = 2500 + (dayIdx * 400);
        buyRate = Number((tenant.defaultBuyRate + (Math.random() * 0.3 - 0.15)).toFixed(2));
        usdSold = 2000 + (dayIdx * 350);
        sellRate = Number((tenant.defaultSellRate + (Math.random() * 0.3 - 0.15)).toFixed(2));
      }

      const totalUsdVolume = Number((usdBought + usdSold).toFixed(2));
      const totalSettlementAmount = Number(
        ((usdBought * buyRate) + (usdSold * sellRate)).toFixed(2)
      );
      const netUsdFlow = Number((usdBought - usdSold).toFixed(2));

      // Operator spread earnings
      const spreadPerDollar = 0.85; // approx ৳0.85 per dollar
      const netProfit = Number((totalUsdVolume * spreadPerDollar).toFixed(2));
      const marginPercentage = Number(((spreadPerDollar / 122.0) * 100).toFixed(2));

      const dailyRecord = await prisma.dailyRecord.create({
        data: {
          tenantId: tenant.id,
          date,
          usdBought,
          buyRate,
          usdSold,
          sellRate,
          totalUsdVolume,
          totalSettlementAmount,
          netUsdFlow,
          netProfit,
          marginPercentage,
          status: "SETTLED",
          notes: `Daily dollar settlement completed for ${date}. All payments verified.`,
        },
      });

      // Create individual trade tickets for this date
      if (usdBought > 0) {
        tradeCounter++;
        await prisma.transaction.create({
          data: {
            tenantId: tenant.id,
            dailyRecordId: dailyRecord.id,
            tradeNumber: `FX-${date.replace(/-/g, "")}-${tradeCounter}`,
            type: "BUY_USD", // Admin buys from client / Client sells USD
            usdAmount: usdBought,
            exchangeRate: buyRate,
            settlementAmount: Number((usdBought * buyRate).toFixed(2)),
            settlementCurrency: "BDT",
            paymentMethod: "Bank Wire",
            paymentStatus: "COMPLETED",
            category: "Export Payout",
            description: `USD Inward Payout - Wire payment at ৳${buyRate}`,
            reference: `SWIFT/TT-${Math.floor(100000 + Math.random() * 900000)}`,
            date,
            createdById: superadmin.id,
          },
        });
      }

      if (usdSold > 0) {
        tradeCounter++;
        await prisma.transaction.create({
          data: {
            tenantId: tenant.id,
            dailyRecordId: dailyRecord.id,
            tradeNumber: `FX-${date.replace(/-/g, "")}-${tradeCounter}`,
            type: "SELL_USD", // Admin sells to client / Client buys USD
            usdAmount: usdSold,
            exchangeRate: sellRate,
            settlementAmount: Number((usdSold * sellRate).toFixed(2)),
            settlementCurrency: "BDT",
            paymentMethod: "Bank Wire",
            paymentStatus: "COMPLETED",
            category: "Import Settlement",
            description: `USD Purchase for Supplier Payment at ৳${sellRate}`,
            reference: `REF-INV-${Math.floor(100000 + Math.random() * 900000)}`,
            date,
            createdById: superadmin.id,
          },
        });
      }
    }
  }

  console.log("🌱 FX Database seeded successfully with realistic Dollar Buy/Sell data!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
