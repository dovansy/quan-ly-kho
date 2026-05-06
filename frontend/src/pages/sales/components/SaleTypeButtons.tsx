import { Col, Row } from 'antd';
import { FiPackage, FiShoppingCart, FiUsers } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { SaleType } from '@/constants/enums';

interface Props {
  onSelect: (type: string) => void;
}

const buttons = [
  {
    type: SaleType.WHOLESALE,
    label: 'Bán buôn',
    icon: <FiPackage />,
    color: '#722ed1',
  },
  {
    type: SaleType.RETAIL,
    label: 'Bán lẻ',
    icon: <FiShoppingCart />,
    color: '#13c2c2',
  },
  {
    type: SaleType.BROKER,
    label: 'Bán qua Nhà môi giới',
    icon: <FiUsers />,
    color: '#fa8c16',
  },
];

export const SaleTypeButtons = ({ onSelect }: Props) => (
  <Row gutter={[16, 16]} className="mb-6">
    {buttons.map(b => (
      <Col xs={24} sm={8} key={b.type}>
        <AppButton
          type="primary"
          icon={b.icon}
          size="large"
          className="w-full"
          style={{ backgroundColor: b.color, borderColor: b.color }}
          onClick={() => onSelect(b.type)}
        >
          {b.label}
        </AppButton>
      </Col>
    ))}
  </Row>
);
