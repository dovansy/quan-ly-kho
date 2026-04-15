import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';

export interface Warehouse {
  key: string;
  id: number;
  name: string;
  address: string;
  manager: string;
  productCount: number;
  inventoryValue: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWarehouseRequest {
  name: string;
  address: string;
  manager: string;
  status?: string;
}

export interface WarehouseListItem {
  label: string;
  value: string;
  id: number;
}

export interface WarehouseFilters {
  keyword?: string;
  status?: string;
}

export const warehousesService = {
  getAll: (params?: WarehouseFilters) =>
    httpClient.get<APIResponse<Warehouse[]>>('/warehouses', { params }),

  create: (data: CreateWarehouseRequest) =>
    httpClient.post<APIResponse<Warehouse>>('/warehouses', data),

  update: (id: number, data: Partial<CreateWarehouseRequest>) =>
    httpClient.put<APIResponse<Warehouse>>(`/warehouses/${id}`, data),

  delete: (id: number) =>
    httpClient.delete<APIResponse<null>>(`/warehouses/${id}`),

  getList: () =>
    httpClient.get<APIResponse<WarehouseListItem[]>>('/warehouses/list'),
};
