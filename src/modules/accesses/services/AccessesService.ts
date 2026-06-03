import { post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface AccessResponse {
  id: string;
  residentId: string;
  visitorId: string;
  type: string;
  status: string;
  qrCode: string | null;
  validFrom: string; // Serialized Date from API
  validUntil: string; // Serialized Date from API
  used: boolean;
  rejectionReason: string | null;
  createdAt: string; // Serialized Date from API
  updatedAt: string; // Serialized Date from API
  deletedAt: string | null; // Serialized Date from API
  resident?: {
    id: string;
    phone: string | null;
    email: string | null;
    user: { id: string; name: string; lastName: string | null };
    house?: { id: string; number: string; street: string };
  };
  visitor?: {
    id: string;
    name: string;
    phone: string | null;
  };
}

export interface CreateAccessDTO {
  residentId: string;
  visitorId?: string;
  visitor?: {
    name: string;
    phone?: string;
  };
  type: string;
  validFrom: string;
  validUntil: string;
}

export interface UpdateAccessDTO {
  type?: string;
  status?: string;
  validFrom?: string;
  validUntil?: string;
  used?: boolean;
  softDelete?: boolean;
  rejectionReason?: string | null;
}

export const getPaginatedAccesses = async (
  params: any,
): Promise<{ data: AccessResponse[]; total: number }> => {
  const res = await post<{ rows: AccessResponse[]; total: number }>(
    "/accesses/datatable",
    params,
  );
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};

export const createAccess = async (
  data: CreateAccessDTO,
): Promise<TResult<AccessResponse>> => {
  return await post<AccessResponse>("/accesses", data);
};

export const updateAccess = async (
  id: string,
  data: UpdateAccessDTO,
): Promise<TResult<AccessResponse>> => {
  return await put<AccessResponse>(`/accesses/${id}`, data);
};

export const deleteAccess = async (id: string): Promise<TResult<AccessResponse>> => {
  return await remove<AccessResponse>(`/accesses/${id}`);
};

