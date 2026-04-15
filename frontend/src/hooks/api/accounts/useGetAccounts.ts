import { useQuery } from '@tanstack/react-query';
import { accountsService, AccountFilters } from '@/services/accounts.service';
import { ACCOUNT_QUERY_KEY } from './queryKeys';

export function useGetAccounts(filters?: AccountFilters) {
  return useQuery({
    queryKey: ACCOUNT_QUERY_KEY.list(filters),
    queryFn: async () => {
      const res = await accountsService.getAll(filters);
      return res.data;
    },
  });
}
