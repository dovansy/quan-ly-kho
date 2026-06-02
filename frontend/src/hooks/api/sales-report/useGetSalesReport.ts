import { useQuery } from '@tanstack/react-query';
import { salesReportsService, SalesReportFilters } from '@/services/salesReports.service';
import { SALES_REPORT_QUERY_KEY } from './queryKeys';

export function useGetSalesReport(filters?: SalesReportFilters) {
  return useQuery({
    queryKey: SALES_REPORT_QUERY_KEY.list(filters),
    queryFn: async () => {
      const res = await salesReportsService.list(filters);
      return res.data;
    },
  });
}
