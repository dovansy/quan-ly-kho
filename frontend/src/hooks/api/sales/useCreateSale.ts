import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService, CreateSaleRequest } from '@/services/sales.service';
import { SALE_QUERY_KEY } from './queryKeys';

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSaleRequest) => salesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALE_QUERY_KEY.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
