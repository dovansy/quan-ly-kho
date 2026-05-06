import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '@/services/sales.service';
import { SALE_QUERY_KEY } from './queryKeys';

export function useReturnSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => salesService.return(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALE_QUERY_KEY.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
