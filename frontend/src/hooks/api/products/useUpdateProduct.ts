import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, CreateProductRequest } from '@/services/products.service';
import { PRODUCT_QUERY_KEY } from './queryKeys';

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, addStock }: { id: number; data: Partial<CreateProductRequest>; addStock?: boolean }) =>
      productsService.update(id, data, addStock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEY.all });
    },
  });
}
