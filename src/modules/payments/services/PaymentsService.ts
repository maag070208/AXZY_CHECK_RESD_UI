import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface FeeResponse {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  type: "ONE_TIME" | "MONTHLY";
  dueDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaymentSummaryResponse {
  pending: { total: number; count: number };
  paid: { total: number; count: number };
}

export interface SubscriptionPlanResponse {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  stripePriceId: string;
  active: boolean;
  interval: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResponse {
  id: string;
  residentId: string;
  feeId: string;
  amount: number;
  reference: string | null;
  status: "PENDING" | "PAID" | "CANCELLED" | "FAILED";
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  resident?: {
    id: string;
    phone: string | null;
    user?: {
      id: string;
      name: string;
      lastName: string | null;
    } | null;
  } | null;
  fee?: {
    id: string;
    name: string;
    amount: number;
  } | null;
}

export interface CreateFeeDTO {
  name: string;
  description?: string;
  amount: number;
  type: "ONE_TIME" | "MONTHLY";
  dueDate: string;
  active?: boolean;
}

export interface UpdateFeeDTO {
  name?: string;
  description?: string;
  amount?: number;
  dueDate?: string;
  active?: boolean;
  softDelete?: boolean;
}

export interface CreatePaymentDTO {
  residentId: string;
  feeId: string;
  amount: number;
  reference?: string;
  status?: "PENDING" | "PAID" | "CANCELLED" | "FAILED";
  paidAt?: string;
}

export interface UpdatePaymentDTO {
  status?: "PENDING" | "PAID" | "CANCELLED" | "FAILED";
  reference?: string;
  paidAt?: string;
  softDelete?: boolean;
}

// ---- Fees API ----
export const getFees = async (): Promise<TResult<FeeResponse[]>> => {
  return await get<FeeResponse[]>("/payments/fees");
};

export const getPaginatedFees = async (params: any): Promise<{ data: FeeResponse[]; total: number }> => {
  const res = await post<{ rows: FeeResponse[]; total: number }>("/payments/fees/datatable", params);
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};

export const getFeeById = async (id: string): Promise<TResult<FeeResponse>> => {
  return await get<FeeResponse>(`/payments/fees/${id}`);
};

export const createFee = async (data: CreateFeeDTO): Promise<TResult<FeeResponse>> => {
  return await post<FeeResponse>("/payments/fees", data);
};

export const updateFee = async (id: string, data: UpdateFeeDTO): Promise<TResult<FeeResponse>> => {
  return await put<FeeResponse>(`/payments/fees/${id}`, data);
};

export const deleteFee = async (id: string): Promise<TResult<FeeResponse>> => {
  return await remove<FeeResponse>(`/payments/fees/${id}`);
};

// ---- Payments API ----
export const getPaginatedPayments = async (params: any): Promise<{ data: PaymentResponse[]; total: number }> => {
  const res = await post<{ rows: PaymentResponse[]; total: number }>("/payments/datatable", params);
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};

export const getPaymentById = async (id: string): Promise<TResult<PaymentResponse>> => {
  return await get<PaymentResponse>(`/payments/${id}`);
};

export const getPaymentSummary = async (): Promise<TResult<PaymentSummaryResponse>> => {
  return await get<PaymentSummaryResponse>("/payments/summary");
};

export const createPayment = async (data: CreatePaymentDTO): Promise<TResult<PaymentResponse>> => {
  return await post<PaymentResponse>("/payments", data);
};

export const updatePayment = async (id: string, data: UpdatePaymentDTO): Promise<TResult<PaymentResponse>> => {
  return await put<PaymentResponse>(`/payments/${id}`, data);
};

export const deletePayment = async (id: string): Promise<TResult<PaymentResponse>> => {
  return await remove<PaymentResponse>(`/payments/${id}`);
};

// ---- Stripe Subscriptions ----
export const getSubscriptionPlans = async (): Promise<TResult<SubscriptionPlanResponse[]>> => {
  return await get<SubscriptionPlanResponse[]>("/payments/subscriptions/plans");
};

export const createCheckoutSession = async (residentId: string, planId: string): Promise<TResult<{ url: string }>> => {
  return await post<{ url: string }>("/payments/subscriptions/checkout", { residentId, planId });
};

export const createPaymentCheckout = async (paymentId: string): Promise<TResult<{ url: string }>> => {
  return await post<{ url: string }>(`/payments/${paymentId}/checkout`, {});
};

// ---- Resident Fee Assignments ----
export interface ResidentFeeResponse {
  id: string;
  residentId: string;
  feeId: string;
  active: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  resident?: {
    id: string;
    phone: string | null;
    user?: { id: string; name: string; lastName: string | null } | null;
  } | null;
  fee?: { id: string; name: string; amount: number; type: string; dueDate: string } | null;
}

export const getResidentFees = async (residentId?: string): Promise<TResult<ResidentFeeResponse[]>> => {
  const query = residentId ? `?residentId=${residentId}` : "";
  return await get<ResidentFeeResponse[]>(`/payments/resident-fees${query}`);
};

export const getPaginatedResidentFees = async (params: any): Promise<{ data: ResidentFeeResponse[]; total: number }> => {
  const res = await post<{ rows: ResidentFeeResponse[]; total: number }>("/payments/resident-fees/datatable", params);
  if (res.success && res.data) {
    return { data: res.data.rows || [], total: res.data.total || 0 };
  }
  return { data: [], total: 0 };
};

export const createResidentFee = async (data: { residentId: string; feeId: string; startDate?: string }): Promise<TResult<ResidentFeeResponse>> => {
  return await post<ResidentFeeResponse>("/payments/resident-fees", data);
};

export const bulkAssignResidentFees = async (data: { residentIds: string[]; feeId: string; startDate?: string }): Promise<TResult<ResidentFeeResponse[]>> => {
  return await post<ResidentFeeResponse[]>("/payments/resident-fees/bulk", data);
};

export const deleteResidentFee = async (id: string): Promise<TResult<ResidentFeeResponse>> => {
  return await remove<ResidentFeeResponse>(`/payments/resident-fees/${id}`);
};
