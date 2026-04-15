import { Card, Col, Statistic } from 'antd';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: ReactNode;
  suffix?: string;
  bgColor?: string;
  valueStyle?: React.CSSProperties;
  colSpan?: number;
}

export const StatCard = ({
  title,
  value,
  prefix,
  suffix,
  bgColor = 'bg-blue-50',
  valueStyle,
  colSpan = 8,
}: StatCardProps) => {
  return (
    <Col xs={24} sm={colSpan}>
      <Card className={`shadow-sm border-none ${bgColor}`}>
        <Statistic
          title={title}
          value={value}
          valueStyle={{ display: 'flex', alignItems: 'center', ...valueStyle }}
          prefix={prefix}
          suffix={suffix}
        />
      </Card>
    </Col>
  );
};
