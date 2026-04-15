import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';
import { User } from '@/types/auth.type';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  email: string;
  phone: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  login: (data: LoginRequest) =>
    httpClient.post<APIResponse<LoginResponse>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    httpClient.post<APIResponse<LoginResponse>>('/auth/register', data),

  getMe: () =>
    httpClient.get<APIResponse<User>>('/auth/me'),

  updateProfile: (data: UpdateProfileRequest) =>
    httpClient.put<APIResponse<User>>('/auth/profile', data),

  changePassword: (data: ChangePasswordRequest) =>
    httpClient.put<APIResponse<null>>('/auth/change-password', data),
};
