import { useQuery } from '@tanstack/react-query';
import { warehousesService, WarehouseFilters } from '@/services/warehouses.service';
import { WAREHOUSE_QUERY_KEY } from './queryKeys';

export function useGetWarehouses(filters?: WarehouseFilters) {
  return useQuery({
    queryKey: WAREHOUSE_QUERY_KEY.list(filters),
    queryFn: async () => {
      const res = await warehousesService.getAll(filters);
      return res.data;
    },
  });
}
