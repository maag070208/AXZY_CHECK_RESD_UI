import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface ResidentResponse {
  id: string;
  userId: string;
  houseId: string;
  phone: string | null;
  email: string | null;
  isOwner: boolean;
  active: boolean;
  softDelete?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user?: {
    id: string;
    name: string;
    lastName: string | null;
    username: string;
    active?: boolean;
  };
  house?: {
    id: string;
    number: string;
    street: string;
    block: string | null;
    reference: string | null;
    latitude: number | null;
    longitude: number | null;
    occupied: boolean;
  };
}

export interface ResidentContactResponse {
  id: string;
  residentId: string;
  name: string;
  phone: string | null;
  email: string | null;
  relationship: string;
  canGenerateAccess: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  resident?: {
    id: string;
    phone: string | null;
    email: string | null;
    isOwner: boolean;
    user?: {
      id: string;
      name: string;
      lastName: string | null;
      username: string;
    };
  };
}

export interface CreateResidentDTO {
  userId?: string;
  user?: {
    name: string;
    lastName?: string;
    username: string;
    password?: string;
  };
  houseId: string;
  phone?: string;
  email?: string;
  isOwner?: boolean;
  active?: boolean;
}

export interface UpdateResidentDTO {
  userId?: string;
  houseId?: string;
  phone?: string;
  email?: string;
  isOwner?: boolean;
  active?: boolean;
  softDelete?: boolean;
}

export interface CreateResidentContactDTO {
  residentId: string;
  name: string;
  phone?: string;
  email?: string;
  relationship: string;
  canGenerateAccess?: boolean;
  active?: boolean;
}

export interface UpdateResidentContactDTO {
  residentId?: string;
  name?: string;
  phone?: string;
  email?: string;
  relationship?: string;
  canGenerateAccess?: boolean;
  active?: boolean;
  softDelete?: boolean;
}

export const getPaginatedResidents = async (params: any): Promise<{ data: ResidentResponse[]; total: number }> => {
  const res = await post<{ rows: ResidentResponse[]; total: number }>("/residents/datatable", params);
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};

export const getResidentById = async (id: string): Promise<TResult<ResidentResponse>> => {
  return await get<ResidentResponse>(`/residents/${id}`);
};

export const createResident = async (data: CreateResidentDTO): Promise<TResult<ResidentResponse>> => {
  return await post<ResidentResponse>("/residents", data);
};

export const updateResident = async (
  id: string,
  data: UpdateResidentDTO
): Promise<TResult<ResidentResponse>> => {
  return await put<ResidentResponse>(`/residents/${id}`, data);
};

export const deleteResident = async (id: string): Promise<TResult<ResidentResponse>> => {
  return await remove<ResidentResponse>(`/residents/${id}`);
};

// ── Contact Operations ────────────────────────────────────────────────────────

export const getPaginatedContacts = async (params: any): Promise<{ data: ResidentContactResponse[]; total: number }> => {
  const res = await post<{ rows: ResidentContactResponse[]; total: number }>("/contacts/datatable", params);
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};

export const createContact = async (data: CreateResidentContactDTO): Promise<TResult<ResidentContactResponse>> => {
  return await post<ResidentContactResponse>("/contacts", data);
};

export const updateContact = async (
  id: string,
  data: UpdateResidentContactDTO
): Promise<TResult<ResidentContactResponse>> => {
  return await put<ResidentContactResponse>(`/contacts/${id}`, data);
};

export const deleteContact = async (id: string): Promise<TResult<ResidentContactResponse>> => {
  return await remove<ResidentContactResponse>(`/contacts/${id}`);
};

export const getMyResidentProfile = async (): Promise<TResult<ResidentResponse>> => {
  return await get<ResidentResponse>("/residents/me");
};
