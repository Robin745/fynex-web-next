import { DailyDollarCalculation } from "./types";

/**
 * Calculates daily Dollar Buy/Sell metrics:
 * - Total USD Volume = usdBought + usdSold
 * - Total Settlement Value = (usdBought * buyRate) + (usdSold * sellRate)
 * - Net USD Flow = usdBought - usdSold
 * - Spread Profit = Estimated operator margin earned on trading volume
 */
export function calculateDailyDollarMetrics(
  usdBought: number,
  buyRate: number,
  usdSold: number,
  sellRate: number,
  spreadPerDollar: number = 0.85
): DailyDollarCalculation {
  const safeBought = Math.max(0, usdBought || 0);
  const safeBuyRate = Math.max(0, buyRate || 0);
  const safeSold = Math.max(0, usdSold || 0);
  const safeSellRate = Math.max(0, sellRate || 0);

  const totalUsdVolume = Number((safeBought + safeSold).toFixed(2));
  const totalSettlementAmount = Number(
    ((safeBought * safeBuyRate) + (safeSold * safeSellRate)).toFixed(2)
  );
  const netUsdFlow = Number((safeBought - safeSold).toFixed(2));

  // Compute spread profit:
  // If both buy & sell occurred, real spread is (sellRate - buyRate) on matched volume plus baseline margin
  let netProfit = 0;
  if (safeBought > 0 && safeSold > 0 && safeSellRate >= safeBuyRate) {
    const matchedVolume = Math.min(safeBought, safeSold);
    const unmatchedVolume = Math.abs(safeBought - safeSold);
    const spreadEarned = (safeSellRate - safeBuyRate) * matchedVolume;
    const residualSpread = unmatchedVolume * spreadPerDollar;
    netProfit = Number((spreadEarned + residualSpread).toFixed(2));
  } else {
    netProfit = Number((totalUsdVolume * spreadPerDollar).toFixed(2));
  }

  const benchmarkRate = safeBuyRate || safeSellRate || 122.0;
  const marginPercentage = Number(((netProfit / (totalSettlementAmount || (totalUsdVolume * benchmarkRate || 1))) * 100).toFixed(2));

  return {
    usdBought: safeBought,
    buyRate: safeBuyRate,
    usdSold: safeSold,
    sellRate: safeSellRate,
    totalUsdVolume,
    totalSettlementAmount,
    netUsdFlow,
    netProfit,
    marginPercentage,
  };
}

/**
 * Aggregates a series of daily dollar records into overall telemetry
 */
export function aggregateDollarRecords(
  records: Array<{
    usdBought: number;
    buyRate: number;
    usdSold: number;
    sellRate: number;
    totalUsdVolume: number;
    totalSettlementAmount: number;
    netUsdFlow: number;
    netProfit: number;
  }>
) {
  let totalUsdBought = 0;
  let totalBuySettlement = 0;
  let totalUsdSold = 0;
  let totalSellSettlement = 0;
  let totalSpreadProfit = 0;

  for (const r of records) {
    const b = r.usdBought || 0;
    const br = r.buyRate || 0;
    const s = r.usdSold || 0;
    const sr = r.sellRate || 0;

    totalUsdBought += b;
    totalBuySettlement += b * br;
    totalUsdSold += s;
    totalSellSettlement += s * sr;
    totalSpreadProfit += r.netProfit || 0;
  }

  const avgBuyRate = totalUsdBought > 0 ? Number((totalBuySettlement / totalUsdBought).toFixed(2)) : 0;
  const avgSellRate = totalUsdSold > 0 ? Number((totalSellSettlement / totalUsdSold).toFixed(2)) : 0;
  const totalUsdVolume = Number((totalUsdBought + totalUsdSold).toFixed(2));
  const totalSettlementAmount = Number((totalBuySettlement + totalSellSettlement).toFixed(2));
  const netUsdFlow = Number((totalUsdBought - totalUsdSold).toFixed(2));

  return {
    totalUsdBought: Number(totalUsdBought.toFixed(2)),
    avgBuyRate,
    totalUsdSold: Number(totalUsdSold.toFixed(2)),
    avgSellRate,
    totalUsdVolume,
    totalSettlementAmount,
    netUsdFlow,
    totalSpreadProfit: Number(totalSpreadProfit.toFixed(2)),
  };
}

/**
 * Format USD volume display helper ($5,000.00)
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Format local currency settlement helper (৳610,000.00)
 */
export function formatSettlement(amount: number, currency: string = "BDT"): string {
  if (currency === "BDT") {
    return "৳" + new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Format FX Rate display helper (৳122.50)
 */
export function formatRate(rate: number, currency: string = "BDT"): string {
  if (currency === "BDT") {
    return `৳${(rate || 0).toFixed(2)}`;
  }
  return `${currency} ${(rate || 0).toFixed(2)}`;
}

// Backward compatibility helper
export const formatCurrency = formatSettlement;
