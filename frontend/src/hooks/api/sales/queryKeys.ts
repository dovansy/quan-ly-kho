import { SaleFilters } from '@/services/sales.service';

export const SALE_QUERY_KEY = {
  all: ['sales'] as const,
  list: (filters?: SaleFilters) => ['sales', 'list', filters] as const,
  detail: (id: number) => ['sales', 'detail', id] as const,
};
