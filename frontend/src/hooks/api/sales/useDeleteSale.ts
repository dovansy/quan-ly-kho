import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '@/services/sales.service';
import { SALE_QUERY_KEY } from './queryKeys';

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => salesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALE_QUERY_KEY.all });
    },
  });
}
