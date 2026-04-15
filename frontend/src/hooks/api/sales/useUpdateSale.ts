import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService, CreateSaleRequest } from '@/services/sales.service';
import { SALE_QUERY_KEY } from './queryKeys';

export function useUpdateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSaleRequest> }) =>
      salesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALE_QUERY_KEY.all });
    },
  });
}
