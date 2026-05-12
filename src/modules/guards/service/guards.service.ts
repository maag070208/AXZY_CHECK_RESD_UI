import { get, post, patch } from "@app/core/axios/axios";
import { fetchDataTable } from "@app/core/services/table-fetcher.service";
import { ITDataTableFetchParams, ITDataTableResponse } from "@app/core/types/datatable.types";
import { CreateAssignmentDTO, Assignment } from "../types/guards.types";

export const getGuardsDataTable = async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<any>> => {
    // Add default filters for guard roles if not present
    const updatedParams = { ...params };
    if (!updatedParams.filters) updatedParams.filters = {};
    
    return await fetchDataTable<any>("/users/datatable", updatedParams);
};

export const createAssignment = async (data: CreateAssignmentDTO) => {
    return await post<Assignment>("/assignments", data);
};

export const getActiveAssignments = async (guardId: number) => {
    return await get<Assignment[]>(`/assignments?guardId=${guardId}`);
};

export const getAllAssignmentsByGuard = async (guardId: number) => {
    return await get<Assignment[]>(`/assignments/all?guardId=${guardId}`);
};

export const updateAssignmentStatus = async (id: number, status: string) => {
    return await patch<Assignment>(`/assignments/${id}/status`, { status });
};

export const getAssignmentsByClient = async (clientId: string | number) => {
    return await get<Assignment[]>(`/assignments?clientId=${clientId}`);
};

export const getAssignmentsDataTable = async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<Assignment>> => {
    return await fetchDataTable<Assignment>("/assignments/datatable", params);
};
