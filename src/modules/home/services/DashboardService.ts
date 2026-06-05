import { get } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";
import { fetchDataTable } from "@app/core/services/table-fetcher.service";

export interface DashboardCounts {
  residents: number;
  guards: number;
  pendingIncidents: number;
  overduePayments: number;
  overduePaymentsAmount: number;
  activePasses: number;
  paymentsPaid: number;
  paymentsPaidAmount: number;
  paymentsPending: number;
  paymentsPendingAmount: number;
}

export interface RecentIncident {
  id: string;
  title: string;
  status: "PENDING" | "ATTENDED";
  createdAt: string;
  guard?: { name: string; lastName: string };
  category?: { name: string };
  type?: { name: string };
}

export interface PaymentSummaryResponse {
  paid: { total: number; count: number };
  pending: { total: number; count: number };
  overdue: { total: number; count: number };
}

const countOnly = async (url: string, filters: Record<string, any> = {}) => {
  try {
    const res = await fetchDataTable<any>(url, { page: 1, limit: 1, filters });
    return res.total ?? 0;
  } catch (_) {
    return 0;
  }
};

const countGuards = async (): Promise<number> => {
  return countOnly("/users/datatable", { role: "GUARD", active: true });
};

const fetchRows = async <T>(url: string, filters: Record<string, any> = {}, limit = 5): Promise<T[]> => {
  try {
    const res = await fetchDataTable<T>(url, { page: 1, limit, filters });
    return (res.rows as T[]) ?? [];
  } catch (_) {
    return [];
  }
};

const fetchSafe = async <T>(url: string): Promise<T | null> => {
  try {
    const res: TResult<T> = await get<T>(url);
    if (res.success && res.data) return res.data;
  } catch (_) {}
  return null;
};

export const fetchDashboardCounts = async (from?: string, to?: string): Promise<DashboardCounts> => {
  const query = from || to ? `?${from ? `from=${from}` : ""}${from && to ? "&" : ""}${to ? `to=${to}` : ""}` : "";
  const [residents, guards, pendingIncidents, activePasses, paymentsSummary] = await Promise.allSettled([
    countOnly("/residents/datatable", { active: true }),
    countGuards(),
    countOnly("/incidents/datatable", { status: "PENDING" }),
    countOnly("/accesses/datatable", { used: false }),
    fetchSafe<PaymentSummaryResponse>(`/payments/summary${query}`),
  ]);

  return {
    residents: residents.status === "fulfilled" ? residents.value : 0,
    guards: guards.status === "fulfilled" ? guards.value : 0,
    pendingIncidents: pendingIncidents.status === "fulfilled" ? pendingIncidents.value : 0,
    overduePayments: paymentsSummary.status === "fulfilled" ? paymentsSummary.value?.overdue?.count ?? 0 : 0,
    overduePaymentsAmount: paymentsSummary.status === "fulfilled" ? Number(paymentsSummary.value?.overdue?.total ?? 0) : 0,
    activePasses: activePasses.status === "fulfilled" ? activePasses.value : 0,
    paymentsPaid: paymentsSummary.status === "fulfilled" ? paymentsSummary.value?.paid?.count ?? 0 : 0,
    paymentsPaidAmount: paymentsSummary.status === "fulfilled" ? Number(paymentsSummary.value?.paid?.total ?? 0) : 0,
    paymentsPending: paymentsSummary.status === "fulfilled" ? paymentsSummary.value?.pending?.count ?? 0 : 0,
    paymentsPendingAmount: paymentsSummary.status === "fulfilled" ? Number(paymentsSummary.value?.pending?.total ?? 0) : 0,
  };
};

export const fetchRecentIncidents = async (limit = 5): Promise<RecentIncident[]> => {
  return fetchRows<RecentIncident>("/incidents/datatable", { status: "PENDING" }, limit);
};

export const fetchRecentPayments = async (limit = 5) => {
  return fetchRows<any>("/payments/datatable", { status: "PAID" }, limit);
};
