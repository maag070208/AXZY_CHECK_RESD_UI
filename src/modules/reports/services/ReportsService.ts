import { post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface PaymentReportParams {
  from: string;
  to: string;
  residentId?: string;
  houseId?: string;
  status?: string;
}

export interface PaymentReportSummary {
  totalCount: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
}

export interface PaymentReportRow {
  id: string;
  residentName: string;
  house: string;
  feeName: string;
  amount: number;
  period: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentReportData {
  summary: PaymentReportSummary;
  rows: PaymentReportRow[];
}

export interface IncidentsComplaintsReportParams {
  from: string;
  to: string;
  categoryId?: string;
  status?: string;
}

export interface IncidentsComplaintsSummary {
  totalIncidents: number;
  totalComplaints: number;
  totalCount: number;
  openCount: number;
  resolvedCount: number;
  avgResolutionHours: number;
}

export interface IncidentsComplaintsRow {
  id: string;
  type: "INCIDENT" | "COMPLAINT";
  title: string;
  category: string;
  reportedBy: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolutionHours: number | null;
}

export interface IncidentsComplaintsReportData {
  summary: IncidentsComplaintsSummary;
  rows: IncidentsComplaintsRow[];
}

export const getPaymentReport = async (
  params: PaymentReportParams,
): Promise<TResult<PaymentReportData>> => {
  return await post<PaymentReportData>("/reports/payments", params);
};

export const getPaymentReportPDF = async (
  params: PaymentReportParams,
): Promise<Blob> => {
  const res = await post("/reports/payments/pdf", params, {
    responseType: "blob",
  });
  return res as unknown as Blob;
};

export const getIncidentsComplaintsReport = async (
  params: IncidentsComplaintsReportParams,
): Promise<TResult<IncidentsComplaintsReportData>> => {
  return await post<IncidentsComplaintsReportData>("/reports/incidents-complaints", params);
};

export const getIncidentsComplaintsReportPDF = async (
  params: IncidentsComplaintsReportParams,
): Promise<Blob> => {
  const res = await post("/reports/incidents-complaints/pdf", params, {
    responseType: "blob",
  });
  return res as unknown as Blob;
};