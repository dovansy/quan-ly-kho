import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { PRODUCT_QUERY_KEY } from './queryKeys';

export function useGetProductList() {
  return useQuery({
    queryKey: [...PRODUCT_QUERY_KEY.all, 'list'] as const,
    queryFn: async () => {
      const res = await productsService.getList();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
