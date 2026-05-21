import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  inventoryService,
  InventoryFilters,
  TransferFilters,
  TransferInventoryRequest,
} from '@/services/inventory.service';

export const INVENTORY_QUERY_KEY = {
  all: ['inventory'] as const,
  list: (f?: InventoryFilters) => ['inventory', 'list', f] as const,
  filters: (f?: InventoryFilters) => ['inventory', 'filter-options', f] as const,
  transfers: (f?: TransferFilters) => ['inventory', 'transfers', f] as const,
};

export function useGetInventory(
  filters?: InventoryFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEY.list(filters),
    queryFn: async () => (await inventoryService.list(filters)).data,
    enabled: options?.enabled,
  });
}

export function useGetInventoryFilters(filters?: InventoryFilters) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEY.filters(filters),
    queryFn: async () => (await inventoryService.filters(filters)).data,
    placeholderData: keepPreviousData,
  });
}

export function useTransferInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TransferInventoryRequest) => inventoryService.transfer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY.all });
      qc.invalidateQueries({ queryKey: ['imports'] });
    },
  });
}

export function useGetTransfers(filters?: TransferFilters) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEY.transfers(filters),
    queryFn: async () => (await inventoryService.transfers(filters)).data,
  });
}
