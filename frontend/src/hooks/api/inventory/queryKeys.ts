import { InventoryFilters } from '@/services/inventory.service';

export const INVENTORY_QUERY_KEY = {
  all: ['inventory'] as const,
  list: (filters?: InventoryFilters) => ['inventory', 'list', filters] as const,
  stats: ['inventory', 'stats'] as const,
};
