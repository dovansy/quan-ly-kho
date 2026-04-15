import { AppButton } from '@/components/atoms/AppButton';
import { AppTable } from '@/components/atoms/AppTable/AppTable';
import { TableProps } from 'antd';
import { ReactNode } from 'react';
import { FiPlus } from 'react-icons/fi';

interface TableSectionProps<T = any> extends Pick<
  TableProps<T>,
  'columns' | 'dataSource' | 'loading' | 'scroll'
> {
  totalLabel: string;
  totalCount: number;
  extraInfo?: ReactNode;
  addLabel?: string;
  onAdd?: () => void;
  extraActions?: ReactNode;
  pageSize?: number;
}

export const TableSection = <T extends object>({
  totalLabel,
  totalCount,
  extraInfo,
  addLabel,
  onAdd,
  extraActions,
  columns,
  dataSource,
  loading,
  scroll,
  pageSize = 10,
}: TableSectionProps<T>) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm table-section">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className="text-lg font-medium">
            {totalLabel}: <span className="text-primary">{totalCount}</span>
          </div>
          {extraInfo}
        </div>
        <div className="flex gap-3">
          {extraActions}
          {addLabel && onAdd && (
            <AppButton type="primary" icon={<FiPlus />} onClick={onAdd}>
              {addLabel}
            </AppButton>
          )}
        </div>
      </div>

      <AppTable
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        scroll={scroll}
        pagination={{
          pageSize,
          total: totalCount,
          showSizeChanger: true,
        }}
      />
    </div>
  );
};
