export type UserRole = "SUPERADMIN" | "CLIENT_USER";
export type TenantRole = "CLIENT_ADMIN" | "CLIENT_VIEWER";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenants: {
    id: string;
    name: string;
    slug: string;
    role: TenantRole;
  }[];
}

export interface ClientDollarSummary {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  clientType: string;
  settlementCurrency: string;
  defaultBuyRate: number;
  defaultSellRate: number;
  totalUsdBought: number;
  avgBuyRate: number;
  totalUsdSold: number;
  avgSellRate: number;
  totalUsdVolume: number;
  totalSettlementAmount: number;
  totalSpreadProfit: number;
  recordsCount: number;
  lastRecordDate?: string;
}

export interface DailyDollarCalculation {
  usdBought: number;
  buyRate: number;
  usdSold: number;
  sellRate: number;
  totalUsdVolume: number;
  totalSettlementAmount: number;
  netUsdFlow: number;
  netProfit: number;
  marginPercentage: number;
}
