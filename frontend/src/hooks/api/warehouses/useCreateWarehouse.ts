import { useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesService, CreateWarehouseRequest } from '@/services/warehouses.service';
import { WAREHOUSE_QUERY_KEY } from './queryKeys';

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarehouseRequest) => warehousesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_QUERY_KEY.all });
    },
  });
}
