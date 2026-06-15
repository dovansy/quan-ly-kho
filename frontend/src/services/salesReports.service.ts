import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';
import { Sale } from './sales.service';

export interface SalesReportFilters {
  brokerName?: string;
  fromDate?: string;
  toDate?: string;
  payment_status?: 'paid' | 'unpaid' | 'pending' | 'cancelled';
}

export const salesReportsService = {
  list: (params?: SalesReportFilters) =>
    httpClient.get<APIResponse<Sale[]>>('/sales-reports', { params }),

  brokers: () =>
    httpClient.get<APIResponse<{ label: string; value: string }[]>>('/sales-reports/brokers'),
};
