import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface HouseResponse {
  id: string;
  number: string;
  street: string;
  block: string | null;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  occupied: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateHouseDTO {
  number: string;
  street: string;
  block?: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
  occupied?: boolean;
  active?: boolean;
}

export interface UpdateHouseDTO {
  number?: string;
  street?: string;
  block?: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
  occupied?: boolean;
  active?: boolean;
  softDelete?: boolean;
}

export const getPaginatedHouses = async (params: any): Promise<{ data: HouseResponse[]; total: number }> => {
  const res = await post<{ rows: HouseResponse[]; total: number }>("/houses/datatable", params);
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};

export const getHouseById = async (id: string): Promise<TResult<HouseResponse>> => {
  return await get<HouseResponse>(`/houses/${id}`);
};

export const createHouse = async (data: CreateHouseDTO): Promise<TResult<HouseResponse>> => {
  return await post<HouseResponse>("/houses", data);
};

export const updateHouse = async (
  id: string,
  data: UpdateHouseDTO
): Promise<TResult<HouseResponse>> => {
  return await put<HouseResponse>(`/houses/${id}`, data);
};

export const deleteHouse = async (id: string): Promise<TResult<HouseResponse>> => {
  return await remove<HouseResponse>(`/houses/${id}`);
};
