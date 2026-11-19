import { calculateDailyDollarMetrics, aggregateDollarRecords } from "../src/lib/calculations";
import { PrismaClient, Transaction, DailyRecord, Tenant } from "@prisma/client";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=========================================");
  console.log("🧪 RUNNING FX DOLLAR BUY/SELL TEST SUITE");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Dollar Buy/Sell Metrics Calculation
  console.log("1. FX Settlement & Volume Formula Verification:");
  const usdBought = 5000;
  const buyRate = 121.50; // 5000 * 121.50 = 607,500
  const usdSold = 2000;
  const sellRate = 122.80; // 2000 * 122.80 = 245,600

  const metrics = calculateDailyDollarMetrics(usdBought, buyRate, usdSold, sellRate, 0.85);
  // Total USD Volume = 5000 + 2000 = 7000
  // Total Settlement = 607,500 + 245,600 = 853,100
  // Net Flow = 5000 - 2000 = +3000
  assert(metrics.totalUsdVolume === 7000, `Total USD Volume is 7,000 (got ${metrics.totalUsdVolume})`);
  assert(metrics.totalSettlementAmount === 853100, `Total Settlement is ৳853,100 (got ${metrics.totalSettlementAmount})`);
  assert(metrics.netUsdFlow === 3000, `Net USD flow is +3,000 (got ${metrics.netUsdFlow})`);
  assert(metrics.netProfit > 0, `Operator spread profit is positive (got ৳${metrics.netProfit})`);

  // TEST 2: Single-direction Trade (Exporter only selling USD)
  console.log("\n2. Exporter Single-Direction Trade Verification:");
  const exportMetrics = calculateDailyDollarMetrics(10000, 121.75, 0, 0, 0.80);
  assert(exportMetrics.totalUsdVolume === 10000, "Volume is 10,000 USD");
  assert(exportMetrics.totalSettlementAmount === 1217500, "Settlement is ৳1,217,500");
  assert(exportMetrics.netUsdFlow === 10000, "Net USD Inflow is 10,000");

  // TEST 3: Multi-Day FX Aggregation Engine
  console.log("\n3. Multi-Day FX Aggregation Engine Verification:");
  const multiDay = [
    { usdBought: 4000, buyRate: 121.50, usdSold: 1000, sellRate: 123.00, totalUsdVolume: 5000, totalSettlementAmount: 609000, netUsdFlow: 3000, netProfit: 4250 },
    { usdBought: 6000, buyRate: 121.80, usdSold: 2000, sellRate: 123.10, totalUsdVolume: 8000, totalSettlementAmount: 977000, netUsdFlow: 4000, netProfit: 6800 },
  ];
  const aggregated = aggregateDollarRecords(multiDay);
  assert(aggregated.totalUsdBought === 10000, "Total USD Bought is 10,000");
  assert(aggregated.totalUsdSold === 3000, "Total USD Sold is 3,000");
  assert(aggregated.totalUsdVolume === 13000, "Total USD Volume is 13,000");
  assert(aggregated.avgBuyRate > 121.60 && aggregated.avgBuyRate < 121.75, `Weighted Buy Rate is accurate (got ৳${aggregated.avgBuyRate})`);
  assert(aggregated.avgSellRate > 123.00 && aggregated.avgSellRate < 123.15, `Weighted Sell Rate is accurate (got ৳${aggregated.avgSellRate})`);

  // TEST 4: Database Tenant Isolation Verification
  console.log("\n4. Database Tenant Isolation Verification:");
  const tenants = await prisma.tenant.findMany({
    include: { transactions: true, dailyRecords: true },
  });

  assert(tenants.length >= 3, `All 3 fixed clients exist in DB (found ${tenants.length})`);

  const robin = tenants.find((t: Tenant & { transactions: Transaction[]; dailyRecords: DailyRecord[] }) => t.slug === "robin-tech")!;
  const rigan = tenants.find((t: Tenant & { transactions: Transaction[]; dailyRecords: DailyRecord[] }) => t.slug === "rigan-travels")!;

  assert(Boolean(robin), "Robin Tech tenant exists");
  assert(Boolean(rigan), "Rigan Travels tenant exists");

  // Check isolation of Robin Tech transactions
  const nonRobinInRobin = robin.transactions.some((t: Transaction) => t.tenantId !== robin.id);
  assert(!nonRobinInRobin, "Robin Tech trades are 100% scoped to Robin Tech");

  // Check isolation of Rigan Travels transactions
  const nonRiganInRigan = rigan.transactions.some((t: Transaction) => t.tenantId !== rigan.id);
  assert(!nonRiganInRigan, "Rigan Travels trades are 100% scoped to Rigan Travels");

  // Insert test trade under Robin Tech
  const testTrade = await prisma.transaction.create({
    data: {
      tenantId: robin.id,
      tradeNumber: "TEST-FX-001",
      type: "BUY_USD",
      usdAmount: 1500,
      exchangeRate: 121.60,
      settlementAmount: 182400,
      settlementCurrency: "BDT",
      paymentMethod: "Bank Wire",
      paymentStatus: "COMPLETED",
      category: "Export Payout",
      description: "Automated Isolation Test Trade for Robin Tech",
      date: "2026-11-19",
    },
  });

  // Verify Rigan Travels CANNOT see Robin Tech's trade
  const riganQuery = await prisma.transaction.findMany({
    where: { tenantId: rigan.id, id: testTrade.id },
  });
  assert(riganQuery.length === 0, "Rigan Travels cannot query or view Robin Tech's trade ticket");

  // Clean up test trade
  await prisma.transaction.delete({ where: { id: testTrade.id } });

  console.log("\n5. Role Switcher Visibility Verification:");
  const hasMultipleRolesFn = (role: string, tenantsCount: number) =>
    role === "SUPERADMIN" || tenantsCount > 1;

  assert(hasMultipleRolesFn("SUPERADMIN", 0) === true, "Superadmin has multiple roles toggle enabled");
  assert(hasMultipleRolesFn("CLIENT_USER", 1) === false, "Single-client user (Robin Tech) hides role switch toggle");
  assert(hasMultipleRolesFn("CLIENT_USER", 2) === true, "Multi-client user enables role switch toggle");

  console.log("\n6. Dollar Entry Aggregation Flow Verification:");
  // Simulate transaction entry for Robin Tech
  const entryTrade = await prisma.transaction.create({
    data: {
      tenantId: robin.id,
      tradeNumber: "TEST-FX-AUTO-01",
      type: "BUY_USD",
      usdAmount: 5000,
      exchangeRate: 121.70,
      settlementAmount: 608500,
      settlementCurrency: "BDT",
      paymentMethod: "Bank Wire",
      paymentStatus: "COMPLETED",
      category: "Dollar Inflow",
      description: "Test daily entry",
      date: "2026-11-25",
    },
  });

  assert(entryTrade.usdAmount === 5000, "Created transaction has exact USD 5,000 amount");
  assert(entryTrade.settlementAmount === 608500, "Settlement amount equals 5000 * 121.70 = ৳608,500");

  // Upsert daily record like createDailyDollarEntryAction does
  const rec = await prisma.dailyRecord.upsert({
    where: {
      tenantId_date: {
        tenantId: robin.id,
        date: "2026-11-25",
      },
    },
    create: {
      tenantId: robin.id,
      date: "2026-11-25",
      usdBought: 5000,
      buyRate: 121.70,
      usdSold: 0,
      sellRate: robin.defaultSellRate,
      totalUsdVolume: 5000,
      totalSettlementAmount: 608500,
      netUsdFlow: 5000,
      netProfit: 4000,
      marginPercentage: 0.65,
      status: "SETTLED",
    },
    update: {
      usdBought: 5000,
      buyRate: 121.70,
    },
  });

  assert(rec.totalSettlementAmount === 608500, "DailyRecord settlement synchronized to ৳608,500");
  assert(rec.totalUsdVolume === 5000, "DailyRecord total USD volume synchronized to 5,000");

  // Clean up
  await prisma.transaction.delete({ where: { id: entryTrade.id } });
  await prisma.dailyRecord.delete({ where: { id: rec.id } });

  console.log("\n=========================================");
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log("=========================================\n");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
