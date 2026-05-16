import { useQuery } from '@tanstack/react-query';
import { salesService, SaleFilters } from '@/services/sales.service';
import { SALE_QUERY_KEY } from './queryKeys';

export function useGetSales(filters?: SaleFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: SALE_QUERY_KEY.list(filters),
    queryFn: async () => {
      const res = await salesService.getAll(filters);
      return res.data;
    },
    enabled: options?.enabled,
  });
}
