import { useMutation } from '@tanstack/react-query';
import { authService, LoginRequest } from '@/services/auth.service';

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
  });
}
