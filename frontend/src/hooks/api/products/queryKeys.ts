import { ProductFilters } from '@/services/products.service';

export const PRODUCT_QUERY_KEY = {
  all: ['products'] as const,
  list: (filters?: ProductFilters) => ['products', 'list', filters] as const,
  detail: (id: number) => ['products', 'detail', id] as const,
};
