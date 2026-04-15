import { useMutation } from '@tanstack/react-query';
import { authService, RegisterRequest } from '@/services/auth.service';

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
  });
}
