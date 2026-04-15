import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsService, CreateAccountRequest } from '@/services/accounts.service';
import { ACCOUNT_QUERY_KEY } from './queryKeys';

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountRequest) => accountsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY.all });
    },
  });
}
