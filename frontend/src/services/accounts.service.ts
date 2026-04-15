import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';

export interface Account {
  key: string;
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

export interface CreateAccountRequest {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}

export interface UpdateAccountRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
}

export interface AccountFilters {
  keyword?: string;
  status?: string;
}

export const accountsService = {
  getAll: (params?: AccountFilters) =>
    httpClient.get<APIResponse<Account[]>>('/accounts', { params }),

  create: (data: CreateAccountRequest) =>
    httpClient.post<APIResponse<Account>>('/accounts', data),

  update: (id: number, data: UpdateAccountRequest) =>
    httpClient.put<APIResponse<Account>>(`/accounts/${id}`, data),

  delete: (id: number) =>
    httpClient.delete<APIResponse<null>>(`/accounts/${id}`),
};
