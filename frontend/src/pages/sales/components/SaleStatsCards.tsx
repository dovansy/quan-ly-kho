import { Row } from 'antd';
import { FiAlertCircle, FiDollarSign } from 'react-icons/fi';
import { StatCard } from '@/components/molecules/stat-card';

interface Props {
  totalRevenue: number;
  totalDebt: number;
}

export const SaleStatsCards = ({ totalRevenue, totalDebt }: Props) => (
  <Row gutter={[16, 16]} className="mb-6">
    <StatCard
      title="Tổng doanh thu"
      value={totalRevenue}
      suffix="vnđ"
      prefix={<FiDollarSign className="mr-2" />}
      bgColor="bg-green-50"
      colSpan={12}
    />
    <StatCard
      title="Dư nợ"
      value={totalDebt}
      suffix="vnđ"
      prefix={<FiAlertCircle className="mr-2" />}
      bgColor="bg-red-50"
      valueStyle={{ color: '#cf1322' }}
      colSpan={12}
    />
  </Row>
);
