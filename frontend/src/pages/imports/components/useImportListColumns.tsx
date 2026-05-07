import { Tag } from 'antd';
import { ActionColumn } from '@/components/molecules/action-column';
import { renderExpiryTag } from '@/utils/expiry';
import { formatDate } from '@/utils/format';
import { renderCartonPieces } from '@/utils/quantity';
import { sttColumn } from '@/utils/tableColumns';
import { ImportRecord } from '../types';

type SortableField = 'product_name' | 'warehouse_name' | 'expiry_date' | 'import_date';
type AntSortOrder = 'ascend' | 'descend' | null;

interface Params {
  onEdit: (r: ImportRecord) => void;
  onDelete: (r: ImportRecord) => void;
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

export const useImportListColumns = ({ onEdit, onDelete, sortBy, sortOrder }: Params) => [
  sttColumn,
  {
    title: 'Tên SP',
    dataIndex: 'product_name',
    key: 'product_name',
    sorter: true,
    sortOrder: getSortOrder('product_name', sortBy, sortOrder),
    render: (t: string) => <span className="font-bold">{t}</span>,
  },
  {
    title: 'Loại',
    dataIndex: 'category',
    key: 'category',
    render: (t: string) => (t ? <Tag color="blue">{t}</Tag> : '-'),
  },
  {
    title: 'Kho',
    dataIndex: 'warehouse_name',
    key: 'warehouse_name',
    sorter: true,
    sortOrder: getSortOrder('warehouse_name', sortBy, sortOrder),
  },
  { title: 'NCC', dataIndex: 'supplier', key: 'supplier' },
  {
    title: 'Lô',
    dataIndex: 'batch',
    key: 'batch',
    render: (t: string) => <Tag color="geekblue">{t}</Tag>,
  },
  {
    title: 'Số lượng',
    key: 'qty',
    align: 'right' as const,
    render: (_: any, r: ImportRecord) =>
      renderCartonPieces(r.total_pieces, r.units_per_carton, r.small_unit?.label),
  },
  {
    title: 'HSD',
    dataIndex: 'expiry_date',
    key: 'expiry_date',
    align: 'center' as const,
    sorter: true,
    sortOrder: getSortOrder('expiry_date', sortBy, sortOrder),
    render: (d: string) => renderExpiryTag(d),
  },
  {
    title: 'Ngày nhập',
    dataIndex: 'import_date',
    key: 'import_date',
    align: 'center' as const,
    sorter: true,
    sortOrder: getSortOrder('import_date', sortBy, sortOrder),
    render: (d: string) => (d ? formatDate(d) : '-'),
  },
  { title: 'Người nhập', dataIndex: 'imported_by', key: 'imported_by' },
  {
    title: 'Hành động',
    key: 'actions',
    align: 'center' as const,
    width: 150,
    render: (_: any, r: ImportRecord) => (
      <ActionColumn
        onEdit={() => onEdit(r)}
        onDelete={() => onDelete(r)}
        deleteTitle="Xóa bản ghi nhập"
        deleteDescription={`Xóa lần nhập SP "${r.product_name}" lô "${r.batch}"?`}
      />
    ),
  },
];
