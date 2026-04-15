import { AccountFilters } from '@/services/accounts.service';

export const ACCOUNT_QUERY_KEY = {
  all: ['accounts'] as const,
  list: (filters?: AccountFilters) => ['accounts', 'list', filters] as const,
  detail: (id: number) => ['accounts', 'detail', id] as const,
};
