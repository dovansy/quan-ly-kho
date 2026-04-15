import { useMutation } from '@tanstack/react-query';
import { authService, ChangePasswordRequest } from '@/services/auth.service';

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
  });
}
