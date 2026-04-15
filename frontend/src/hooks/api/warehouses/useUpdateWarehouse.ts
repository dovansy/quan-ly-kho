import { useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesService, CreateWarehouseRequest } from '@/services/warehouses.service';
import { WAREHOUSE_QUERY_KEY } from './queryKeys';

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateWarehouseRequest> }) =>
      warehousesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_QUERY_KEY.all });
    },
  });
}
