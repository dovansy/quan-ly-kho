import { Tag } from 'antd';
import { ActionColumn } from '@/components/molecules/action-column';
import { saleTypeLabels } from '@/constants/options';
import { formatCurrency, formatDate } from '@/utils/format';
import { sttColumn } from '@/utils/tableColumns';
import { SaleOrderRow } from '../types';

type SortableField = 'customer_name' | 'status' | 'sale_date' | 'total_amount';
type AntSortOrder = 'ascend' | 'descend' | null;

interface Params {
  onView: (r: SaleOrderRow) => void;
  onEdit: (r: SaleOrderRow) => void;
  onDelete: (r: SaleOrderRow) => void;
  onReturn: (r: SaleOrderRow) => void;
  sortBy?: SortableField;
  sortOrder?: 'asc' | 'desc';
}

const getSortOrder = (
  field: SortableField,
  sortBy?: SortableField,
  sortOrder?: 'asc' | 'desc'
): AntSortOrder => {
  if (sortBy !== field) return null;
  return sortOrder === 'asc' ? 'ascend' : 'descend';
};

export const useSaleListColumns = ({
  onView,
  onEdit,
  onDelete,
  onReturn,
  sortBy,
  sortOrder,
}: Params) => [
  sttColumn,
  {
    title: 'Khách hàng',
    dataIndex: 'customer_name',
    key: 'customer_name',
    sorter: true,
    sortOrder: getSortOrder('customer_name', sortBy, sortOrder),
    render: (t: string, r: SaleOrderRow) => (
      <div>
        <div className="font-bold">{t || '—'}</div>
        {r.sale_type === 'broker' && r.broker_name && (
          <div className="text-xs text-gray-500">NMG: {r.broker_name}</div>
        )}
      </div>
    ),
  },
  { title: 'SĐT', dataIndex: 'customer_phone', key: 'customer_phone' },
  {
    title: 'Loại',
    dataIndex: 'sale_type',
    key: 'sale_type',
    align: 'center' as const,
    render: (s: string) => {
      const i = saleTypeLabels[s] || { label: s, color: 'default' };
      return <Tag color={i.color}>{i.label}</Tag>;
    },
  },
  {
    title: 'Số sản phẩm',
    key: 'line_count',
    align: 'center' as const,
    render: (_: any, r: SaleOrderRow) => r.items.length,
  },
  {
    title: 'Tổng tiền (vnđ)',
    dataIndex: 'total_amount',
    key: 'total_amount',
    align: 'right' as const,
    sorter: true,
    sortOrder: getSortOrder('total_amount', sortBy, sortOrder),
    render: (v: number) => formatCurrency(v),
  },
  {
    title: 'Trạng thái',
    key: 'status',
    align: 'center' as const,
    sorter: true,
    sortOrder: getSortOrder('status', sortBy, sortOrder),
    render: (_: any, r: SaleOrderRow) => {
      if (r.returned) return <Tag color="warning">Đã hoàn hàng</Tag>;
      return r.paid ? <Tag color="success">Đã trả</Tag> : <Tag color="error">Còn nợ</Tag>;
    },
  },
  {
    title: 'Ngày bán',
    dataIndex: 'sale_date',
    key: 'sale_date',
    align: 'center' as const,
    sorter: true,
    sortOrder: getSortOrder('sale_date', sortBy, sortOrder),
    render: (d: string) => formatDate(d),
  },
  {
    title: 'Hành động',
    key: 'actions',
    align: 'center' as const,
    width: 150,
    render: (_: any, r: SaleOrderRow) => (
      <ActionColumn
        onView={() => onView(r)}
        onEdit={() => onEdit(r)}
        editDisabled={r.returned}
        onReturn={r.returned ? undefined : () => onReturn(r)}
        onDelete={() => onDelete(r)}
        deleteTitle="Xóa hóa đơn"
        deleteDescription={`Xóa hóa đơn của khách "${r.customer_name || '—'}"?`}
        returnDescription={`Hoàn lại hàng của hóa đơn "${r.customer_name || '—'}" về kho?`}
      />
    ),
  },
];
