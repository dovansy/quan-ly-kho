import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';

export interface SaleItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Sale {
  key: string;
  id: number;
  invoice_code: string;
  customer_name: string;
  customer_phone: string;
  sale_type: string;
  items: SaleItem[];
  total_amount: number;
  paid: boolean;
  sale_date: string;
  created_by: string;
  created_at: string;
}

export interface CreateSaleRequest {
  customerName: string;
  customerPhone: string;
  saleType: string;
  items: SaleItem[];
  paid: boolean;
  saleDate: string;
  createdBy?: string;
}

export interface SaleFilters {
  keyword?: string;
  paid?: string;
  saleDate?: string;
  page?: number;
  limit?: number;
}

export const salesService = {
  getAll: (params?: SaleFilters) =>
    httpClient.get<APIResponse<Sale[]>>('/sales', { params }),

  create: (data: CreateSaleRequest) =>
    httpClient.post<APIResponse<Sale>>('/sales', data),

  update: (id: number, data: Partial<CreateSaleRequest>) =>
    httpClient.put<APIResponse<Sale>>(`/sales/${id}`, data),

  delete: (id: number) =>
    httpClient.delete<APIResponse<null>>(`/sales/${id}`),
};
