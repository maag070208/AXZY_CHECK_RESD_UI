import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface ComplaintCategoryResponse {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface ComplaintResponse {
  id: string;
  residentId: string;
  categoryId: string;
  title: string;
  description: string;
  media: any;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resident?: {
    id: string;
    phone: string | null;
    user?: {
      id: string;
      name: string;
      lastName: string | null;
    };
  };
  category?: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  resolvedBy?: {
    id: string;
    name: string;
    lastName: string | null;
  };
}

export interface CreateComplaintDTO {
  categoryId: string;
  title: string;
  description: string;
  media?: any;
}

export interface UpdateComplaintDTO {
  categoryId?: string;
  title?: string;
  description?: string;
  media?: any;
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
}

export interface ComplaintMessageResponse {
  id: string;
  complaintId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    lastName: string | null;
  };
}

export const getPaginatedComplaints = async (
  params: any
): Promise<{ data: ComplaintResponse[]; total: number }> => {
  const res = await post<{ rows: ComplaintResponse[]; total: number }>(
    "/complaints/datatable",
    params
  );
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};

export const getComplaintCategories = async (): Promise<
  TResult<ComplaintCategoryResponse[]>
> => {
  return await get<ComplaintCategoryResponse[]>("/complaints/categories");
};

export const createComplaint = async (
  data: CreateComplaintDTO
): Promise<TResult<ComplaintResponse>> => {
  return await post<ComplaintResponse>("/complaints", data);
};

export const updateComplaint = async (
  id: string,
  data: UpdateComplaintDTO
): Promise<TResult<ComplaintResponse>> => {
  return await put<ComplaintResponse>(`/complaints/${id}`, data);
};

export const deleteComplaint = async (
  id: string
): Promise<TResult<ComplaintResponse>> => {
  return await remove<ComplaintResponse>(`/complaints/${id}`);
};

export const getComplaintMessages = async (
  complaintId: string
): Promise<TResult<ComplaintMessageResponse[]>> => {
  return await get<ComplaintMessageResponse[]>(`/complaints/${complaintId}/messages`);
};

export const createComplaintMessage = async (
  complaintId: string,
  message: string
): Promise<TResult<ComplaintMessageResponse>> => {
  return await post<ComplaintMessageResponse>(`/complaints/${complaintId}/messages`, { message });
};

export const getComplaintById = async (
  id: string
): Promise<TResult<ComplaintResponse>> => {
  return await get<ComplaintResponse>(`/complaints/${id}`);
};
