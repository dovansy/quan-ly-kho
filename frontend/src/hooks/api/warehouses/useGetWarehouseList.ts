import { useQuery } from '@tanstack/react-query';
import { warehousesService } from '@/services/warehouses.service';
import { WAREHOUSE_QUERY_KEY } from './queryKeys';

export function useGetWarehouseList() {
  return useQuery({
    queryKey: [...WAREHOUSE_QUERY_KEY.all, 'list'] as const,
    queryFn: async () => {
      const res = await warehousesService.getList();
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
