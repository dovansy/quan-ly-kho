import { AppButton } from '@/components/atoms/AppButton';
import { Form, FormInstance, Space } from 'antd';
import { Children, ReactNode } from 'react';
import { FiRotateCcw, FiSearch } from 'react-icons/fi';

interface FilterSectionProps {
  form: FormInstance;
  onSearch: (values: any) => void;
  onClear: () => void;
  loading?: boolean;
  children: ReactNode;
}

export const FilterSection = ({
  form,
  onSearch,
  onClear,
  loading = false,
  children,
}: FilterSectionProps) => {
  const stacked = Children.count(children) >= 4;

  const actions = (
    <Form.Item className="mb-0">
      <Space size="middle">
        <AppButton onClick={onClear} icon={<FiRotateCcw />} variant="outlined" type="default">
          Xóa bộ lọc
        </AppButton>
        <AppButton type="primary" htmlType="submit" icon={<FiSearch />} loading={loading}>
          Tìm kiếm
        </AppButton>
      </Space>
    </Form.Item>
  );

  return (
    <div className="p-6 mb-6 bg-white rounded-lg shadow-sm filter-section">
      <Form form={form} layout="vertical" onFinish={onSearch}>
        {stacked ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-6 w-full">{children}</div>
            <div className="flex justify-end">{actions}</div>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-6">
            <div className="flex gap-6 flex-1">{children}</div>
            {actions}
          </div>
        )}
      </Form>
    </div>
  );
};
