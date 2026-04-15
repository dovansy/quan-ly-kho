import { useQuery } from '@tanstack/react-query';
import { inventoryService, InventoryFilters } from '@/services/inventory.service';
import { INVENTORY_QUERY_KEY } from './queryKeys';

export function useGetInventory(filters?: InventoryFilters) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEY.list(filters),
    queryFn: async () => {
      const res = await inventoryService.getAll(filters);
      return res.data;
    },
  });
}
