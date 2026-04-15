import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, CreateProductRequest } from '@/services/products.service';
import { PRODUCT_QUERY_KEY } from './queryKeys';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) => productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEY.all });
    },
  });
}
