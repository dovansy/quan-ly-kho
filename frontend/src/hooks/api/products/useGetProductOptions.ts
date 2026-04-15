import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { PRODUCT_QUERY_KEY } from './queryKeys';

export function useGetProductOptions() {
  return useQuery({
    queryKey: [...PRODUCT_QUERY_KEY.all, 'options'] as const,
    queryFn: async () => {
      const res = await productsService.getOptions();
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
