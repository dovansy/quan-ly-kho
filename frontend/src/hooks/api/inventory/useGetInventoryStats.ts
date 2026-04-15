import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { inventoryService, InventoryFilters } from '@/services/inventory.service';
import { INVENTORY_QUERY_KEY } from './queryKeys';

export function useGetInventoryStats(filters?: Partial<InventoryFilters>) {
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEY.stats, filters] as const,
    queryFn: async () => {
      const res = await inventoryService.getStats(filters);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}
