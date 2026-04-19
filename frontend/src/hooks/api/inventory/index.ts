import { useQuery } from '@tanstack/react-query';
import { inventoryService, InventoryFilters } from '@/services/inventory.service';

export const INVENTORY_QUERY_KEY = {
  all: ['inventory'] as const,
  list: (f?: InventoryFilters) => ['inventory', 'list', f] as const,
  filters: (f?: InventoryFilters) => ['inventory', 'filter-options', f] as const,
};

export function useGetInventory(filters?: InventoryFilters) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEY.list(filters),
    queryFn: async () => (await inventoryService.list(filters)).data,
  });
}

export function useGetInventoryFilters(filters?: InventoryFilters) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEY.filters(filters),
    queryFn: async () => (await inventoryService.filters(filters)).data,
  });
}
