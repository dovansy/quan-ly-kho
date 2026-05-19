import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';

export interface StockImport {
  id: number;
  key: string;
  product_id: number;
  product_name: string;
  category: string | null;
  warehouse_id: number;
  warehouse_name: string;
  supplier: string;
  batch: string;
  small_unit_id: number;
  small_unit: { id: number; code: string; label: string } | null;
  carton_quantity: number;
  units_per_carton: number;
  piece_quantity: number;
  total_pieces: number;
  expiry_date: string;
  imported_by: string | null;
  import_date: string;
  note: string | null;
  input_total_pieces?: number | null;
  units_per_box?: number | null;
  has_sales?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStockImportRequest {
  product_name: string;
  category?: string;
  warehouse_id: number;
  supplier: string;
  batch: string;
  small_unit_id: number;
  carton_quantity?: number;
  units_per_carton?: number;
  piece_quantity?: number;
  expiry_date: string;
  import_date?: string;
  note?: string;
  input_mode?: 'kien' | 'vien';
  input_total_pieces?: number | null;
  units_per_box?: number | null;
}

export interface StockImportFilters {
  keyword?: string;
  warehouse_id?: number;
  supplier?: string;
  batch?: string;
  productId?: number;
  importDate?: string;
  page?: number;
  limit?: number;
  sort_by?: 'product_name' | 'warehouse_name' | 'expiry_date' | 'import_date';
  sort_order?: 'asc' | 'desc';
}

export const stockImportsService = {
  list: (params?: StockImportFilters) =>
    httpClient.get<APIResponse<StockImport[]>>('/imports', { params }),

  create: (data: CreateStockImportRequest) =>
    httpClient.post<APIResponse<StockImport>>('/imports', data),

  update: (id: number, data: Partial<CreateStockImportRequest>) =>
    httpClient.put<APIResponse<StockImport>>(`/imports/${id}`, data),

  delete: (id: number) =>
    httpClient.delete<APIResponse<null>>(`/imports/${id}`),
};
