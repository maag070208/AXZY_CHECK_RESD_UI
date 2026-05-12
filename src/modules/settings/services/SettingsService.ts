import { post, put, remove } from "@core/axios/axios";

const BASE_URL = "/settings";

export interface IncidentCategory {
    id: number;
    name: string;
    value: string;
    type: "INCIDENT" | "MAINTENANCE";

    color?: string;
    icon?: string;
}

export interface IncidentType {
    id: number;
    categoryId: number;
    name: string;
    value: string;
    category?: IncidentCategory;
}

export interface SysConfig {
    key: string;
    value: string;
}

// Incident Categories
export const getPaginatedIncidentCategories = async (params: any): Promise<{ data: IncidentCategory[], total: number }> => {
    const res = await post<any>(`${BASE_URL}/categories/datatable`, params);
    return {
        data: res.data?.rows || [],
        total: res.data?.total || 0
    };
};

export const createIncidentCategory = async (data: Partial<IncidentCategory>) => {
    return post(`${BASE_URL}/categories`, data);
};

export const updateIncidentCategory = async (id: number, data: Partial<IncidentCategory>) => {
    return put(`${BASE_URL}/categories/${id}`, data);
};

export const deleteIncidentCategory = async (id: number) => {
    return remove(`${BASE_URL}/categories/${id}`);
};

// Incident Types
export const getPaginatedIncidentTypes = async (params: any): Promise<{ data: IncidentType[], total: number }> => {
    const res = await post<any>(`${BASE_URL}/types/datatable`, params);
    return {
        data: res.data?.rows || [],
        total: res.data?.total || 0
    };
};

export const createIncidentType = async (data: Partial<IncidentType>) => {
    return post(`${BASE_URL}/types`, data);
};

export const updateIncidentType = async (id: number, data: Partial<IncidentType>) => {
    return put(`${BASE_URL}/types/${id}`, data);
};

export const deleteIncidentType = async (id: number) => {
    return remove(`${BASE_URL}/types/${id}`);
};

// SysConfig
export const getPaginatedSysConfig = async (params: any): Promise<{ data: SysConfig[], total: number }> => {
    const res = await post<any>(`${BASE_URL}/sysconfig/datatable`, params);
    return {
        data: res.data?.rows || [],
        total: res.data?.total || 0
    };
};

export const updateSysConfig = async (key: string, value: string) => {
    return post(`${BASE_URL}/sysconfig`, { key, value });
};

export const deleteSysConfig = async (key: string) => {
    return remove(`${BASE_URL}/sysconfig/${key}`);
};
