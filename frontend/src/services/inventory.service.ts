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
  available_pieces?: number;
  pending_reserved?: number;
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
  exclude_pending_sale_order_id?: number;
  sort_by?: 'product_name' | 'warehouse_name' | 'nearest_expiry';
  sort_order?: 'asc' | 'desc';
}

export interface InventoryFilterOptions {
  warehouses: { label: string; value: number }[];
  categories: { label: string; value: string }[];
  suppliers: { label: string; value: string }[];
  batches: { label: string; value: string }[];
}

export interface TransferInventoryRequest {
  product_id: number;
  warehouse_id_from: number;
  warehouse_id_to: number;
  supplier: string;
  batch: string;
  quantity: number;
  note?: string;
}

export interface InventoryTransferRecord {
  id: number;
  key: string;
  product_id: number;
  product_name: string;
  category: string | null;
  warehouse_id_from: number;
  warehouse_from_name: string;
  warehouse_id_to: number;
  warehouse_to_name: string;
  supplier: string;
  batch: string;
  quantity: number;
  units_per_carton: number | null;
  small_unit: { id: number; code: string; label: string } | null;
  transferred_by: string | null;
  transfer_date: string;
  note: string | null;
  created_at: string;
}

export interface TransferFilters {
  keyword?: string;
  warehouse_id_from?: number;
  warehouse_id_to?: number;
  supplier?: string;
  batch?: string;
  transferDate?: string;
  page?: number;
  limit?: number;
}

export const inventoryService = {
  list: (params?: InventoryFilters) =>
    httpClient.get<APIResponse<InventoryItem[]>>('/inventory', { params }),

  filters: (params?: InventoryFilters) =>
    httpClient.get<APIResponse<InventoryFilterOptions>>('/inventory/filters', { params }),

  transfer: (data: TransferInventoryRequest) =>
    httpClient.post<APIResponse<null>>('/inventory/transfer', data),

  transfers: (params?: TransferFilters) =>
    httpClient.get<APIResponse<InventoryTransferRecord[]>>('/inventory/transfers', { params }),
};
