import { WarehouseFilters } from '@/services/warehouses.service';

export const WAREHOUSE_QUERY_KEY = {
  all: ['warehouses'] as const,
  list: (filters?: WarehouseFilters) => ['warehouses', 'list', filters] as const,
  detail: (id: number) => ['warehouses', 'detail', id] as const,
};
