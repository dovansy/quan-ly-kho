import dayjs from 'dayjs';
import { exportToExcel } from '@/utils/exportExcel';
import { formatDate } from '@/utils/format';
import { ImportRecord } from './types';

export const exportImportsExcel = (data: ImportRecord[]) => {
  const sorted = [...data].sort((a, b) => {
    const byDate = (b.import_date || '').localeCompare(a.import_date || '');
    if (byDate !== 0) return byDate;
    const byId = Number((b as any).id || 0) - Number((a as any).id || 0);
    if (byId !== 0) return byId;
    return (a.product_name || '').localeCompare(b.product_name || '', 'vi');
  });
  exportToExcel(
    [
      { title: 'STT', dataIndex: 'index' },
      { title: 'Tên SP', dataIndex: 'product_name' },
      { title: 'Loại', dataIndex: 'category' },
      { title: 'Kho', dataIndex: 'warehouse_name' },
      { title: 'NCC', dataIndex: 'supplier' },
      { title: 'Lô', dataIndex: 'batch' },
      { title: 'Đơn vị lẻ', dataIndex: 'small_unit', render: (u: any) => u?.label || '' },
      { title: 'Số kiện', dataIndex: 'carton_quantity' },
      { title: 'Lẻ/Kiện', dataIndex: 'units_per_carton' },
      { title: 'Số lẻ (ngoài kiện)', dataIndex: 'piece_quantity' },
      { title: 'Tổng (lẻ)', dataIndex: 'total_pieces' },
      {
        title: 'HSD',
        dataIndex: 'expiry_date',
        render: (v: string) => (v ? formatDate(v) : ''),
      },
      {
        title: 'Ngày nhập',
        dataIndex: 'import_date',
        render: (v: string) => (v ? formatDate(v) : ''),
      },
      { title: 'Người nhập', dataIndex: 'imported_by' },
    ],
    sorted,
    `Nhap_hang_${dayjs().format('YYYYMMDD_HHmmss')}`,
    'Nhap hang'
  );
};
