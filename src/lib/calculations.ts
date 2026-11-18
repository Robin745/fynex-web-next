import { DailyLedgerCalculation } from "./types";

/**
 * Calculates net profit and profit margin percentage for a set of numbers.
 * Formula:
 * Net Profit = Gross Sales - (COGS + Operating Expenses + Platform Fee)
 * Margin % = (Net Profit / Gross Sales) * 100
 */
export function calculateDailyMetrics(
  grossSales: number,
  cogs: number,
  operatingExpenses: number,
  platformFeePercent: number,
  customPlatformFee?: number
): DailyLedgerCalculation {
  const safeGross = Math.max(0, grossSales || 0);
  const safeCogs = Math.max(0, cogs || 0);
  const safeOpex = Math.max(0, operatingExpenses || 0);

  // Platform fee is either custom fixed or calculated from percentage of gross sales
  const platformFee =
    customPlatformFee !== undefined && customPlatformFee !== null
      ? Math.max(0, customPlatformFee)
      : Number(((safeGross * (platformFeePercent || 0)) / 100).toFixed(2));

  const totalCosts = safeCogs + safeOpex + platformFee;
  const netProfit = Number((safeGross - totalCosts).toFixed(2));

  let marginPercentage = 0;
  if (safeGross > 0) {
    marginPercentage = Number(((netProfit / safeGross) * 100).toFixed(2));
  } else if (netProfit < 0) {
    marginPercentage = -100;
  }

  return {
    grossSales: safeGross,
    cogs: safeCogs,
    operatingExpenses: safeOpex,
    platformFee,
    netProfit,
    marginPercentage,
  };
}

/**
 * Aggregates a series of daily records into total metrics
 */
export function aggregateRecords(
  records: Array<{
    grossSales: number;
    cogs: number;
    operatingExpenses: number;
    platformFee: number;
    netProfit: number;
  }>
) {
  const totals = records.reduce(
    (acc, r) => {
      acc.grossSales += r.grossSales || 0;
      acc.cogs += r.cogs || 0;
      acc.operatingExpenses += r.operatingExpenses || 0;
      acc.platformFee += r.platformFee || 0;
      acc.netProfit += r.netProfit || 0;
      return acc;
    },
    {
      grossSales: 0,
      cogs: 0,
      operatingExpenses: 0,
      platformFee: 0,
      netProfit: 0,
    }
  );

  const roundedGross = Number(totals.grossSales.toFixed(2));
  const roundedNet = Number(totals.netProfit.toFixed(2));
  const overallMarginPercent =
    roundedGross > 0
      ? Number(((roundedNet / roundedGross) * 100).toFixed(2))
      : 0;

  return {
    totalGrossSales: roundedGross,
    totalCogs: Number(totals.cogs.toFixed(2)),
    totalOperatingExpenses: Number(totals.operatingExpenses.toFixed(2)),
    totalPlatformFees: Number(totals.platformFee.toFixed(2)),
    totalNetProfit: roundedNet,
    overallMarginPercent,
  };
}

/**
 * Format currency display helper
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
