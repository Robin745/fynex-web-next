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

export interface ClientFinancialSummary {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  platformFeePercent: number;
  currency: string;
  totalGrossSales: number;
  totalCogs: number;
  totalOperatingExpenses: number;
  totalPlatformFees: number;
  totalNetProfit: number;
  overallMarginPercent: number;
  recordsCount: number;
  lastRecordDate?: string;
}

export interface DailyLedgerCalculation {
  grossSales: number;
  cogs: number;
  operatingExpenses: number;
  platformFee: number;
  netProfit: number;
  marginPercentage: number;
}
