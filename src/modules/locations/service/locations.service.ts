import { get, post, put, remove } from "@app/core/axios/axios";

export interface Location {
  id: string;
  zoneId?: string;
  zone?: { name: string };
  name: string;
  reference?: string;
  aisle?: string;
  spot?: string;
  number?: string;
  isOccupied: boolean;
  entries?: any[]; // For count
  _count?: { tasks: number };
}

export const getLocations = async () => {
  return await get<Location[]>("/locations");
};

export const createLocation = async (data: any) => {
  return await post<Location>("/locations", data);
};

export const updateLocation = async (id: string, data: any) => {
  return await put<Location>(`/locations/${id}`, data);
};

export const deleteLocation = async (id: string) => {
  return await remove(`/locations/${id}`);
};

export const getPaginatedLocations = async (params: any) => {
  const res = await post<any>("/locations/datatable", params);
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};
