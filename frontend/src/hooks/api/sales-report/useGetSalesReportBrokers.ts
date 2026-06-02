import { useQuery } from '@tanstack/react-query';
import { salesReportsService } from '@/services/salesReports.service';
import { SALES_REPORT_QUERY_KEY } from './queryKeys';

export function useGetSalesReportBrokers() {
  return useQuery({
    queryKey: SALES_REPORT_QUERY_KEY.brokers,
    queryFn: async () => {
      const res = await salesReportsService.brokers();
      return res.data;
    },
  });
}
