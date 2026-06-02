import { AppButton } from '@/components/atoms/AppButton';
import { AppTable } from '@/components/atoms/AppTable/AppTable';
import { TableProps } from 'antd';
import { ReactNode, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { PaginationContext } from '@/utils/tableColumns';

interface TableSectionProps<T = any> extends Pick<
  TableProps<T>,
  'columns' | 'dataSource' | 'loading' | 'scroll' | 'onChange' | 'expandable'
> {
  totalLabel: string;
  totalCount: number;
  extraInfo?: ReactNode;
  addLabel?: string;
  onAdd?: () => void;
  extraActions?: ReactNode;
  pageSize?: number;
  current?: number;
  isFiltering?: boolean;
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
  pageSize = 20,
  current,
  isFiltering,
  onChange,
  expandable,
}: TableSectionProps<T>) => {
  const [internalPagination, setInternalPagination] = useState({
    current: current ?? 1,
    pageSize,
  });
  const effectivePagination = {
    current: current ?? internalPagination.current,
    pageSize: internalPagination.pageSize,
  };
  const paginationConfig =
    current !== undefined
      ? { current, pageSize, total: totalCount, showSizeChanger: true }
      : { defaultPageSize: pageSize, total: totalCount, showSizeChanger: true };

  const handleChange: TableProps<T>['onChange'] = (pag, filt, sorter, extra) => {
    if (pag) {
      setInternalPagination({
        current: pag.current ?? 1,
        pageSize: pag.pageSize ?? pageSize,
      });
    }
    onChange?.(pag, filt, sorter, extra);
  };

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

      <PaginationContext.Provider value={effectivePagination}>
        <AppTable
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          scroll={scroll}
          isFiltering={isFiltering}
          onChange={handleChange}
          pagination={paginationConfig}
          expandable={expandable}
        />
      </PaginationContext.Provider>
    </div>
  );
};
