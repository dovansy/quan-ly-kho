import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';

export interface SaleItem {
  id?: number;
  product_id: number;
  product_name: string;
  warehouse_id: number;
  warehouse_name?: string;
  supplier: string;
  batch: string;
  small_unit_id: number;
  small_unit?: { id: number; code: string; label: string } | null;
  quantity: number;
  unit_price: number;
  total: number;
  units_per_carton?: number;
}

export interface Sale {
  id: number;
  key: string;
  invoice_code: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  broker_name: string | null;
  sale_type: string;
  // Mặc định API list không trả items để tối ưu tốc độ — chỉ trả items_count.
  // Detail (GET /sales/:id) hoặc list?include_items=true mới có items.
  items?: SaleItem[];
  items_count: number;
  total_amount: number;
  paid: boolean;
  payment_status: 'paid' | 'unpaid' | 'pending';
  sale_date: string;
  returned: boolean;
  returned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSaleRequest {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  brokerName?: string;
  saleType: string;
  items: Omit<SaleItem, 'id' | 'warehouse_name' | 'small_unit'>[];
  paid?: boolean;
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
  saleDate: string;
}

export interface SaleFilters {
  keyword?: string;
  paid?: string;
  payment_status?: 'paid' | 'unpaid' | 'pending';
  saleDate?: string;
  sale_type?: string;
  page?: number;
  limit?: number;
  sort_by?: 'customer_name' | 'status' | 'sale_date' | 'total_amount';
  sort_order?: 'asc' | 'desc';
  include_items?: boolean;
}

export const salesService = {
  getAll: (params?: SaleFilters) =>
    httpClient.get<APIResponse<Sale[]>>('/sales', { params }),

  getDetail: (id: number) =>
    httpClient.get<APIResponse<Sale>>(`/sales/${id}`),

  create: (data: CreateSaleRequest) =>
    httpClient.post<APIResponse<Sale>>('/sales', data),

  update: (id: number, data: Partial<CreateSaleRequest>) =>
    httpClient.put<APIResponse<Sale>>(`/sales/${id}`, data),

  delete: (id: number) =>
    httpClient.delete<APIResponse<null>>(`/sales/${id}`),

  return: (id: number) =>
    httpClient.post<APIResponse<Sale>>(`/sales/${id}/return`),

  confirmShipment: (id: number, paymentStatus: 'paid' | 'unpaid') =>
    httpClient.post<APIResponse<Sale>>(`/sales/${id}/confirm-shipment`, { paymentStatus }),
};
