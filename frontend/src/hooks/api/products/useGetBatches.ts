import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { PRODUCT_QUERY_KEY } from './queryKeys';

export function useGetBatches(name?: string, warehouse?: string) {
  return useQuery({
    queryKey: [...PRODUCT_QUERY_KEY.all, 'batches', name, warehouse] as const,
    queryFn: async () => {
      const res = await productsService.getBatches({ name, warehouse });
      return res.data;
    },
    enabled: !!(name || warehouse), // chỉ fetch khi có ít nhất 1 param
  });
}
