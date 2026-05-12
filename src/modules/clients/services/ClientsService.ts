import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface Client {
    id: string;
    name: string;
    address?: string | null;
    rfc?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    active: boolean;
    softDelete: boolean;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
    locations?: any[]; // Basic representation
    users?: any[];
    zones?: any[];
}

export interface ClientCreate {
    name: string;
    address?: string;
    rfc?: string;
    contactName?: string;
    contactPhone?: string;
    active?: boolean;
    appUsername?: string;
    appPassword?: string;
}

export interface ClientUpdate {
    name?: string;
    address?: string;
    rfc?: string;
    contactName?: string;
    contactPhone?: string;
    active?: boolean;
    appUsername?: string;
    appPassword?: string;
    softDelete?: boolean;
}

export interface DatatableResponse<T> {
    rows: T[];
    total: number;
    page: number;
    limit: number;
}

export const getClientById = async (id: string | number): Promise<TResult<Client>> => {
    return await get<Client>(`/clients/${id}`);
};

export const getPaginatedClients = async (params: any): Promise<TResult<DatatableResponse<Client>>> => {
    return await post<DatatableResponse<Client>>("/clients/datatable", params);
};

export const createClient = async (data: ClientCreate): Promise<TResult<Client[]>> => {
    return await post<Client[]>("/clients", data);
};

export const updateClient = async (id: string | number, data: ClientUpdate): Promise<TResult<Client[]>> => {
    return await put<Client[]>(`/clients/${id}`, data);
};

export const deleteClient = async (id: string | number): Promise<TResult<Client[]>> => {
    return await remove<Client[]>(`/clients/${id}`);
};
