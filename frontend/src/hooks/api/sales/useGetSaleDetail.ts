import { useQuery } from '@tanstack/react-query';
import { salesService } from '@/services/sales.service';
import { SALE_QUERY_KEY } from './queryKeys';

export function useGetSaleDetail(id: number | null | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: SALE_QUERY_KEY.detail(id || 0),
    queryFn: async () => (await salesService.getDetail(id as number)).data,
    enabled: !!id && enabled,
  });
}
