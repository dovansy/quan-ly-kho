import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsService } from '@/services/accounts.service';
import { ACCOUNT_QUERY_KEY } from './queryKeys';

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => accountsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY.all });
    },
  });
}
