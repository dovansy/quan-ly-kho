import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, UpdateProfileRequest } from '@/services/auth.service';
import { AUTH_QUERY_KEY } from './queryKeys';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => authService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.me });
    },
  });
}
