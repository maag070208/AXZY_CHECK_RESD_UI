import { get, post, put, remove } from "@app/core/axios/axios";

export interface Zone {
  id: string;
  clientId: string;
  name: string;
  active: boolean;
}

export const getZonesByClient = async (clientId: string) => {
  const res = await get<any>(`/zones/client/${clientId}`);
  return res.data || [];
};

export const getZones = async () => {
  const res = await post<any>("/zones/datatable", { page: 1, limit: 1000 });
  return {
    success: res.success,
    data: res.data?.rows || [],
    messages: res.messages || [],
  };
};

export const getPaginatedZones = async (params: any) => {
  const res = await post<any>("/zones/datatable", params);
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};

export const createZone = async (data: { clientId: string; name: string }) => {
  return await post<Zone>("/zones", data);
};

export const updateZone = async (
  id: string,
  data: { name?: string; active?: boolean },
) => {
  return await put<Zone>(`/zones/${id}`, data);
};

export const deleteZone = async (id: string) => {
  return await remove(`/zones/${id}`);
};
