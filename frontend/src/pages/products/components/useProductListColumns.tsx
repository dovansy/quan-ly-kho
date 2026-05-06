import { Tag } from 'antd';
import { ActionColumn } from '@/components/molecules/action-column';
import { statusLabels } from '@/constants/options';
import { sttColumn } from '@/utils/tableColumns';
import { ProductRow } from '../types';

interface Params {
  onEdit: (r: ProductRow) => void;
}

export const useProductListColumns = ({ onEdit }: Params) => [
  sttColumn,
  {
    title: 'Tên SP',
    dataIndex: 'name',
    key: 'name',
    render: (t: string) => <span className="font-bold">{t}</span>,
  },
  {
    title: 'Loại',
    dataIndex: 'category',
    key: 'category',
    render: (t: string) => (t ? <Tag color="blue">{t}</Tag> : '-'),
  },
  {
    title: 'NCC',
    dataIndex: 'supplier',
    key: 'supplier',
    render: (t: string) => t || '-',
  },
  {
    title: 'Đơn vị lẻ',
    dataIndex: 'default_small_unit',
    key: 'default_small_unit',
    render: (u: any) => u?.label || '-',
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    align: 'center' as const,
    render: (s: string) => {
      const info = statusLabels[s] || { label: s, color: 'default' };
      return <Tag color={info.color}>{info.label}</Tag>;
    },
  },
  {
    title: 'Hành động',
    key: 'actions',
    align: 'center' as const,
    width: 120,
    render: (_: any, r: ProductRow) => <ActionColumn onEdit={() => onEdit(r)} />,
  },
];
