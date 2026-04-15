import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsService, UpdateAccountRequest } from '@/services/accounts.service';
import { ACCOUNT_QUERY_KEY } from './queryKeys';

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAccountRequest }) =>
      accountsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY.all });
    },
  });
}
