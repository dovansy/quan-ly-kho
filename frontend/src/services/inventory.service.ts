import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';

export interface InventoryItem {
  id: number;
  key: string;
  product_id: number;
  product_name: string;
  category: string | null;
  warehouse_id: number;
  warehouse_name: string;
  supplier: string;
  batch: string;
  stock_pieces: number;
  units_per_carton: number | null;
  nearest_expiry: string | null;
  small_unit: { id: number; code: string; label: string } | null;
  updated_at: string;
}

export interface InventoryFilters {
  keyword?: string;
  warehouse_id?: number;
  category?: string;
  supplier?: string;
  batch?: string;
  includeEmpty?: boolean;
  sort_by?: 'product_name' | 'warehouse_name' | 'nearest_expiry';
  sort_order?: 'asc' | 'desc';
}

export interface InventoryFilterOptions {
  warehouses: { label: string; value: number }[];
  categories: { label: string; value: string }[];
  suppliers: { label: string; value: string }[];
  batches: { label: string; value: string }[];
}

export const inventoryService = {
  list: (params?: InventoryFilters) =>
    httpClient.get<APIResponse<InventoryItem[]>>('/inventory', { params }),

  filters: (params?: InventoryFilters) =>
    httpClient.get<APIResponse<InventoryFilterOptions>>('/inventory/filters', { params }),
};
