import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { inventoryService, InventoryFilters } from '@/services/inventory.service';
import { INVENTORY_QUERY_KEY } from './queryKeys';

export function useGetInventoryFilters(selected?: Partial<InventoryFilters>) {
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEY.all, 'filters', selected] as const,
    queryFn: async () => {
      const res = await inventoryService.getFilters(selected);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}
