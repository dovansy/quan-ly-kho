import { useQuery } from '@tanstack/react-query';
import { productsService, ProductFilters } from '@/services/products.service';
import { PRODUCT_QUERY_KEY } from './queryKeys';

export function useGetProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEY.list(filters),
    queryFn: async () => {
      const res = await productsService.getAll(filters);
      return res.data;
    },
  });
}
