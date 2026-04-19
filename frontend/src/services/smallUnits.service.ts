import httpClient from './httpClient';
import { APIResponse } from '@/types/api.type';

export interface SmallUnit {
  id: number;
  key: string;
  code: string;
  label: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface SmallUnitOption {
  label: string;
  value: number;
  code: string;
}

export interface CreateSmallUnitRequest {
  code: string;
  label: string;
  status?: string;
}

export interface SmallUnitFilters {
  keyword?: string;
  status?: string;
}

export const smallUnitsService = {
  list: (params?: SmallUnitFilters) =>
    httpClient.get<APIResponse<SmallUnit[]>>('/small-units', { params }),

  options: () =>
    httpClient.get<APIResponse<SmallUnitOption[]>>('/small-units/options'),

  create: (data: CreateSmallUnitRequest) =>
    httpClient.post<APIResponse<SmallUnit>>('/small-units', data),

  update: (id: number, data: Partial<CreateSmallUnitRequest>) =>
    httpClient.put<APIResponse<SmallUnit>>(`/small-units/${id}`, data),

  delete: (id: number) =>
    httpClient.delete<APIResponse<null>>(`/small-units/${id}`),
};
