import dayjs from 'dayjs';
import { paymentStatusLabels, saleTypeLabels } from '@/constants/options';
import { exportToExcel } from '@/utils/exportExcel';
import { formatCartonPiecesPlain, formatCurrency, formatDate } from '@/utils/format';
import { SaleLine, SaleOrderDetail, SaleOrderRow } from './types';

const renderCurrencyCell = (v: any) => {
  if (v === '' || v === null || v === undefined) return '';
  return formatCurrency(Number(v));
};

export const exportSalesExcel = (orders: SaleOrderDetail[]) => {
  const sortedOrders = [...orders].sort((a, b) => {
    const byDate = (b.sale_date || '').localeCompare(a.sale_date || '');
    if (byDate !== 0) return byDate;
    return Number(b.id || 0) - Number(a.id || 0);
  });

  const flat = sortedOrders.flatMap(s => {
    const saleTypeLabel = saleTypeLabels[s.sale_type]?.label || s.sale_type;
    const items = s.items.length
      ? [...s.items].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
      : [null];
    return items.map((l: any) => ({
      customer_name: s.customer_name,
      broker_name: s.broker_name || '',
      customer_phone: s.customer_phone,
      customer_address: s.customer_address,
      sale_type: saleTypeLabel,
      paid: paymentStatusLabels[s.payment_status]?.label || (s.paid ? 'Đã thanh toán' : 'Chưa thanh toán'),
      sale_date: s.sale_date,
      total_amount: s.total_amount,
      product_name: l?.product_name || '',
      warehouse_name: l?.warehouse_name || '',
      supplier: l?.supplier || '',
      batch: l?.batch || '',
      small_unit_label: l?.small_unit_label || '',
      quantity: l
        ? formatCartonPiecesPlain(l.quantity, Number(l.units_per_carton) || 0, l.small_unit_label)
        : '',
      unit_price: l?.unit_price ?? '',
      line_total: l?.total ?? '',
    }));
  });

  exportToExcel(
    [
      { title: 'STT', dataIndex: 'index' },
      {
        title: 'Khách hàng/đơn hàng',
        dataIndex: 'customer_name',
        render: (v: string, r: any) =>
          r.broker_name ? `${v || ''}\nNMG: ${r.broker_name}` : v || '',
      },
      { title: 'SĐT', dataIndex: 'customer_phone' },
      { title: 'Địa chỉ', dataIndex: 'customer_address' },
      { title: 'Loại bán', dataIndex: 'sale_type' },
      { title: 'Thanh toán', dataIndex: 'paid' },
      {
        title: 'Ngày bán',
        dataIndex: 'sale_date',
        render: (v: string) => (v ? formatDate(v) : ''),
      },
      { title: 'Tên SP', dataIndex: 'product_name' },
      { title: 'Kho', dataIndex: 'warehouse_name' },
      { title: 'NCC', dataIndex: 'supplier' },
      { title: 'Lô', dataIndex: 'batch' },
      { title: 'Đơn vị', dataIndex: 'small_unit_label' },
      { title: 'Số lượng', dataIndex: 'quantity' },
      { title: 'Đơn giá (vnđ)', dataIndex: 'unit_price', render: renderCurrencyCell },
      { title: 'Tổng tiền (vnđ)', dataIndex: 'line_total', render: renderCurrencyCell },
    ],
    flat,
    `Ban_hang_${dayjs().format('YYYYMMDD_HHmmss')}`,
    'Ban hang'
  );
};

/**
 * Xuất Excel cho 1 hóa đơn — danh sách sản phẩm trong hóa đơn đó.
 * `items` cần đã được enrich `units_per_carton` (theo lô tồn kho hiện tại).
 */
export const exportSaleDetailExcel = (_order: SaleOrderRow, items: SaleLine[]) => {
  const sortedItems = [...items].sort((a, b) => {
    const byId = Number(b.id || 0) - Number(a.id || 0);
    if (byId !== 0) return byId;
    return (a.product_name || '').localeCompare(b.product_name || '', 'vi');
  });
  const rows = sortedItems.map((l, i) => ({
    index: i + 1,
    product_name: l.product_name,
    warehouse_name: l.warehouse_name,
    supplier: l.supplier,
    batch: l.batch,
    small_unit_label: l.small_unit_label,
    quantity: formatCartonPiecesPlain(l.quantity, l.units_per_carton, l.small_unit_label),
    unit_price: l.unit_price,
    total: l.total,
  }));

  exportToExcel(
    [
      { title: 'STT', dataIndex: 'index' },
      { title: 'Tên sản phẩm', dataIndex: 'product_name' },
      { title: 'Kho', dataIndex: 'warehouse_name' },
      { title: 'NCC', dataIndex: 'supplier' },
      { title: 'Lô', dataIndex: 'batch' },
      { title: 'Đơn vị', dataIndex: 'small_unit_label' },
      { title: 'Số lượng', dataIndex: 'quantity' },
      { title: 'Đơn giá (vnđ)', dataIndex: 'unit_price', render: renderCurrencyCell },
      { title: 'Thành tiền (vnđ)', dataIndex: 'total', render: renderCurrencyCell },
    ],
    rows,
    `HoaDon_${_order.customer_name}_${dayjs().format('YYYYMMDD_HHmmss')}`,
    'Hoa don'
  );
};
