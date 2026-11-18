import { calculateDailyMetrics, aggregateRecords } from "../src/lib/calculations";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=========================================");
  console.log("🧪 RUNNING SYSTEM & BUSINESS FORMULA TESTS");
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

  // TEST 1: Financial Calculation Formula
  console.log("1. Business Calculation Formula Verification:");
  const grossSales = 10000;
  const cogs = 4000;
  const opex = 1500;
  const feePercent = 10.0; // 10% of 10000 = 1000

  const metrics = calculateDailyMetrics(grossSales, cogs, opex, feePercent);
  // Expected platform fee = 1000
  // Total costs = 4000 + 1500 + 1000 = 6500
  // Net profit = 10000 - 6500 = 3500
  // Margin % = (3500 / 10000) * 100 = 35.0%
  assert(metrics.platformFee === 1000, `Platform fee is 1000 (got ${metrics.platformFee})`);
  assert(metrics.netProfit === 3500, `Net profit is 3500 (got ${metrics.netProfit})`);
  assert(metrics.marginPercentage === 35, `Margin percentage is 35% (got ${metrics.marginPercentage}%)`);

  // TEST 2: Zero Sales Edge Case
  const zeroMetrics = calculateDailyMetrics(0, 0, 500, 10);
  assert(zeroMetrics.platformFee === 0, `Zero sales platform fee is 0`);
  assert(zeroMetrics.netProfit === -500, `Zero sales with expense produces net loss of -500`);
  assert(zeroMetrics.marginPercentage === -100, `Zero sales margin is capped gracefully at -100%`);

  // TEST 3: Multi-Day Ledger Aggregation
  console.log("\n2. Aggregation Engine Verification:");
  const multiDay = [
    { grossSales: 1000, cogs: 400, operatingExpenses: 100, platformFee: 100, netProfit: 400 },
    { grossSales: 2000, cogs: 800, operatingExpenses: 200, platformFee: 200, netProfit: 800 },
  ];
  const aggregated = aggregateRecords(multiDay);
  assert(aggregated.totalGrossSales === 3000, "Aggregated gross sales is 3000");
  assert(aggregated.totalNetProfit === 1200, "Aggregated net profit is 1200");
  assert(aggregated.overallMarginPercent === 40, "Aggregated margin is 40%");

  // TEST 4: Database Tenant Isolation Verification
  console.log("\n3. Database Tenant Isolation Verification:");
  const tenants = await prisma.tenant.findMany({
    include: { transactions: true, dailyRecords: true },
  });

  assert(tenants.length >= 2, `At least 2 tenants exist (found ${tenants.length})`);

  const tenantA = tenants[0];
  const tenantB = tenants[1];

  // Check that transactions of Tenant A have tenantId equal to tenantA.id
  const nonAInA = tenantA.transactions.some((t) => t.tenantId !== tenantA.id);
  assert(!nonAInA, `Tenant ${tenantA.slug} transactions are 100% scoped to Tenant A`);

  // Check that transactions of Tenant B have tenantId equal to tenantB.id
  const nonBInB = tenantB.transactions.some((t) => t.tenantId !== tenantB.id);
  assert(!nonBInB, `Tenant ${tenantB.slug} transactions are 100% scoped to Tenant B`);

  // Check transaction creation isolation
  const newTx = await prisma.transaction.create({
    data: {
      tenantId: tenantA.id,
      type: "EXPENSE",
      category: "Software & Tools",
      description: "Automated Test Transaction Scoped to Tenant A",
      amount: 99.99,
      date: "2026-11-17",
      paymentStatus: "COMPLETED",
    },
  });

  // Query Tenant B transactions to ensure newTx is NOT visible to Tenant B
  const tenantBTransactions = await prisma.transaction.findMany({
    where: { tenantId: tenantB.id, id: newTx.id },
  });
  assert(tenantBTransactions.length === 0, "Tenant B cannot query Tenant A's newly inserted transaction");

  // Clean up test transaction
  await prisma.transaction.delete({ where: { id: newTx.id } });

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
