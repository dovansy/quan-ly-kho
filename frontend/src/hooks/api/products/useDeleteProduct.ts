import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { PRODUCT_QUERY_KEY } from './queryKeys';

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEY.all });
    },
  });
}
