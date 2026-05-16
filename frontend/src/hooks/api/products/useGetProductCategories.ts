import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';

export function useGetProductCategories(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['products', 'categories'] as const,
    queryFn: async () => (await productsService.getCategories()).data,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled,
  });
}
