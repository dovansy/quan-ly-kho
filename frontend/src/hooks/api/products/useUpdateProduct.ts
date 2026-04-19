import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, UpdateProductRequest } from '@/services/products.service';
import { PRODUCT_QUERY_KEY } from './queryKeys';

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRequest }) =>
      productsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEY.all });
    },
  });
}
