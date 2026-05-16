import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { AUTH_QUERY_KEY } from './queryKeys';

export function useGetMe(enabled = true) {
  return useQuery({
    queryKey: AUTH_QUERY_KEY.me,
    queryFn: async () => {
      const res = await authService.getMe();
      return res.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
