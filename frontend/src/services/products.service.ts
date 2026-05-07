import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';

export interface Product {
  id: number;
  key: string;
  name: string;
  category: string | null;
  supplier: string | null;
  default_small_unit_id: number;
  default_small_unit: { id: number; code: string; label: string } | null;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProductRequest {
  category?: string | null;
  supplier?: string | null;
  default_small_unit_id?: number;
  status?: string;
}

export interface ProductFilters {
  keyword?: string;
  category?: string;
  supplier?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: 'name';
  sort_order?: 'asc' | 'desc';
}

export const productsService = {
  getAll: (params?: ProductFilters) =>
    httpClient.get<APIResponse<Product[]>>('/products', { params }),

  update: (id: number, data: UpdateProductRequest) =>
    httpClient.put<APIResponse<Product>>(`/products/${id}`, data),

  getCategories: () =>
    httpClient.get<APIResponse<{ label: string; value: string }[]>>('/products/categories'),
};
