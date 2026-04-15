import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';

export interface UnitEntry {
  unit: string;
  quantity: number;
  conversionRate: number;
}

export interface Product {
  key: string;
  id: number;
  name: string;
  category: string;
  warehouse_name: string;
  supplier: string;
  batch: string;
  quantity: number;
  min_stock: number;
  unit_price: number;
  unit: string;
  expiry_date: string;
  imported_by: string;
  unitEntries: UnitEntry[];
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  category: string;
  warehouse: string;
  batch: string;
  unitEntries: UnitEntry[];
  unitPrice: number;
  importedBy: string;
  supplier?: string;
  unit?: string;
  minStock?: number;
}

export interface ProductOptions {
  categories: { label: string; value: string }[];
  warehouses: { label: string; value: string }[];
  suppliers: { label: string; value: string }[];
  batches: { label: string; value: string }[];
}

export interface ProductListItem {
  label: string;
  value: string;
  price: number;
  id: number;
}

export interface ProductFilters {
  keyword?: string;
  category?: string;
  warehouse?: string;
  page?: number;
  limit?: number;
}

export const productsService = {
  getAll: (params?: ProductFilters) =>
    httpClient.get<APIResponse<Product[]>>('/products', { params }),

  create: (data: CreateProductRequest) =>
    httpClient.post<APIResponse<Product>>('/products', data),

  update: (id: number, data: Partial<CreateProductRequest>, addStock = false) =>
    httpClient.put<APIResponse<Product>>(`/products/${id}${addStock ? '?addStock=true' : ''}`, data),

  delete: (id: number) =>
    httpClient.delete<APIResponse<null>>(`/products/${id}`),

  getOptions: () =>
    httpClient.get<APIResponse<ProductOptions>>('/products/options'),

  getBatches: (params?: { name?: string; warehouse?: string }) =>
    httpClient.get<APIResponse<{ label: string; value: string }[]>>('/products/batches', { params }),

  getList: () =>
    httpClient.get<APIResponse<ProductListItem[]>>('/products/list'),
};
