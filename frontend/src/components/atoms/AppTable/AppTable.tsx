import { useMemo } from 'react';

import { Table, TableProps } from 'antd';
import clsx from 'clsx';

import AppLoading from '../AppLoading';
import styles from './AppTable.module.scss';
import { getDefaultPaginationOptions } from './const';

export function AppTable<T extends object = object>({
  pagination,
  className,
  loading,
  isFiltering,
  showHeader,
  ...props
}: TableProps<T> & { isFiltering?: boolean; showHeader?: boolean }) {
  const classNames = clsx(
    className,
    styles.appTable,
    '[&_div.ant-table]:rounded-[12px] [&_div.ant-table]:border-1 [&_div.ant-table]:border-[var(--border-table))]',
    '[&_table_tbody.ant-table-tbody>tr>td.ant-table-cell]:text-body-2 [&_table_tbody.ant-table-tbody>tr>td.ant-table-cell]:text-black',
    '[&_thead.ant-table-thead>tr>th.ant-table-cell]:text-body-2-bold [&_thead.ant-table-thead>tr>th.ant-table-cell]:text-black',
    '[&_table_thead.ant-table-thead>tr>th]:bg-[var(--table-header-bg)] [&_table_thead.ant-table-thead>tr>th]:py-[19px]',
    '[&_table_thead.ant-table-thead>tr>th]:border-none [&_div.ant-table]:bg-transparent [&_table_thead.ant-table-thead>tr>th]:!py-[13px]',
    '[&_table_tbody.ant-table-tbody>tr>td]:border-gray-5 [&_table_tbody.ant-table-tbody>tr>td.ant-table-cell]:py-[13px]',
    '[&_table_tbody.ant-table-tbody>tr.ant-table-placeholder]:bg-transparent',
    '[&_table_thead.ant-table-thead>tr:hover]:bg-[var(--table-row-bg-hover)]'
  );

  const renderEmptyPlace = () => {
    return (
      <div className={clsx(className, 'flex flex-col items-center justify-center py-32')}>
        {/* {isFiltering ? <IconEmptyTable /> : <IconNoData />} */}
        <p className="mt-4 text-body-2">{isFiltering ? 'No record found' : 'No data'}</p>
      </div>
    );
  };

  const paginationOptions = useMemo(() => {
    if (typeof pagination === 'boolean') return pagination;

    if (!pagination) return getDefaultPaginationOptions();

    if (typeof pagination === 'object') {
      return {
        ...getDefaultPaginationOptions(),
        ...pagination,
      };
    }

    return undefined;
  }, [pagination]);

  return (
    <Table
      locale={{
        emptyText: loading ? <></> : renderEmptyPlace(),
      }}
      pagination={paginationOptions}
      showHeader={showHeader || !!props.dataSource?.length}
      className={classNames}
      rowClassName="row"
      loading={
        loading
          ? { indicator: <AppLoading className="inset-1/2" />, spinning: true, size: 'large' }
          : false
      }
      {...props}
    />
  );
}
