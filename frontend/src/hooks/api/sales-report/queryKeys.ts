import { SalesReportFilters } from '@/services/salesReports.service';

export const SALES_REPORT_QUERY_KEY = {
  all: ['sales-report'] as const,
  list: (filters?: SalesReportFilters) => ['sales-report', 'list', filters] as const,
  brokers: ['sales-report', 'brokers'] as const,
};
