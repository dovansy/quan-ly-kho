import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '@/services/sales.service';
import { SALE_QUERY_KEY } from './queryKeys';

export function useConfirmShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paymentStatus }: { id: number; paymentStatus: 'paid' | 'unpaid' }) =>
      salesService.confirmShipment(id, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALE_QUERY_KEY.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
