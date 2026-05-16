import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smallUnitsService, SmallUnitFilters, CreateSmallUnitRequest } from '@/services/smallUnits.service';

export const SMALL_UNIT_QUERY_KEY = {
  all: ['small-units'] as const,
  list: (f?: SmallUnitFilters) => ['small-units', 'list', f] as const,
  options: () => ['small-units', 'options'] as const,
};

export function useGetSmallUnits(filters?: SmallUnitFilters) {
  return useQuery({
    queryKey: SMALL_UNIT_QUERY_KEY.list(filters),
    queryFn: async () => (await smallUnitsService.list(filters)).data,
  });
}

export function useGetSmallUnitOptions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: SMALL_UNIT_QUERY_KEY.options(),
    queryFn: async () => (await smallUnitsService.options()).data,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled,
  });
}

export function useCreateSmallUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSmallUnitRequest) => smallUnitsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SMALL_UNIT_QUERY_KEY.all }),
  });
}

export function useUpdateSmallUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSmallUnitRequest> }) =>
      smallUnitsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SMALL_UNIT_QUERY_KEY.all }),
  });
}

export function useDeleteSmallUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => smallUnitsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SMALL_UNIT_QUERY_KEY.all }),
  });
}
