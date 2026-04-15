import { useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesService } from '@/services/warehouses.service';
import { WAREHOUSE_QUERY_KEY } from './queryKeys';

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => warehousesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_QUERY_KEY.all });
    },
  });
}
