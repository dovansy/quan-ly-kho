import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockImportsService, StockImportFilters, CreateStockImportRequest } from '@/services/stockImports.service';

export const IMPORT_QUERY_KEY = {
  all: ['imports'] as const,
  list: (f?: StockImportFilters) => ['imports', 'list', f] as const,
};

export function useGetImports(filters?: StockImportFilters) {
  return useQuery({
    queryKey: IMPORT_QUERY_KEY.list(filters),
    queryFn: async () => (await stockImportsService.list(filters)).data,
  });
}

export function useCreateImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStockImportRequest) => stockImportsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: IMPORT_QUERY_KEY.all });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateStockImportRequest> }) =>
      stockImportsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: IMPORT_QUERY_KEY.all });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useDeleteImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => stockImportsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: IMPORT_QUERY_KEY.all });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
