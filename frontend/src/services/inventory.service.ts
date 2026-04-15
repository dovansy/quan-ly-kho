import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';

export interface InventoryItem {
  key: string;
  name: string;
  warehouse: string;
  category: string;
  supplier: string;
  batch: string;
  quantity: number;
  minStock: number;
  price: number;
  unit: string;
  expiryDate: string;
  importDate: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
}

export interface InventoryFilters {
  warehouse?: string;
  category?: string;
  supplier?: string;
  batch?: string;
  keyword?: string;
}

export interface InventoryFilterOptions {
  warehouses: { label: string; value: string }[];
  categories: { label: string; value: string }[];
  suppliers: { label: string; value: string }[];
  batches: { label: string; value: string }[];
}

export const inventoryService = {
  getAll: (params?: InventoryFilters) =>
    httpClient.get<APIResponse<InventoryItem[]>>('/inventory', { params }),

  getStats: (params?: Partial<InventoryFilters>) =>
    httpClient.get<APIResponse<InventoryStats>>('/inventory/stats', { params }),

  getFilters: (params?: Partial<InventoryFilters>) =>
    httpClient.get<APIResponse<InventoryFilterOptions>>('/inventory/filters', { params }),
};
