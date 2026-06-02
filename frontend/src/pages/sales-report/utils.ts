import dayjs from 'dayjs';
import { exportToExcel } from '@/utils/exportExcel';
import { formatCartonPiecesPlain, formatCurrency, formatDate } from '@/utils/format';
import { SaleOrderDetail } from '@/pages/sales/types';
import { paymentStatusLabels, saleTypeLabels } from '@/constants/options';

const renderCurrencyCell = (value: any) => {
  if (value === '' || value === null || value === undefined) return '';
  return formatCurrency(Number(value));
};

export const exportSalesReportExcel = (
  orders: SaleOrderDetail[],
  filters: { brokerName?: string; fromDate?: string; toDate?: string }
) => {
  const sortedOrders = [...orders].sort((a, b) => {
    const byDate = (b.sale_date || '').localeCompare(a.sale_date || '');
    if (byDate !== 0) return byDate;
    const byId = Number(b.id || 0) - Number(a.id || 0);
    if (byId !== 0) return byId;
    const byCustomer = (a.customer_name || '').localeCompare(b.customer_name || '', 'vi');
    if (byCustomer !== 0) return byCustomer;
    return (a.broker_name || '').localeCompare(b.broker_name || '', 'vi');
  });

  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  const orderInfoColumnIndexes = [0, 1, 2, 3, 4, 13];
  let rowIndex = 1;

  const rows = sortedOrders.flatMap((order, orderIndex) => {
    const items = order.items.length
      ? [...order.items].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
      : [null];
    if (items.length > 1) {
      orderInfoColumnIndexes.forEach(columnIndex => {
        merges.push({
          s: { r: rowIndex, c: columnIndex },
          e: { r: rowIndex + items.length - 1, c: columnIndex },
        });
      });
    }
    rowIndex += items.length;

    return items.map((item: any) => ({
      order_index: orderIndex + 1,
      customer_name: order.customer_name,
      invoice_code: order.invoice_code,
      broker_name: order.broker_name || '',
      sale_type: saleTypeLabels[order.sale_type]?.label || order.sale_type,
      payment_status: order.returned
        ? 'Đã hoàn hàng'
        : paymentStatusLabels[order.payment_status]?.label ||
          (order.paid ? 'Đã thanh toán' : 'Chưa thanh toán'),
      sale_date: order.sale_date,
      order_total: order.total_amount,
      product_name: item?.product_name || '',
      warehouse_name: item?.warehouse_name || '',
      supplier: item?.supplier || '',
      batch: item?.batch || '',
      small_unit_label: item?.small_unit_label || '',
      quantity: item
        ? formatCartonPiecesPlain(item.quantity, item.units_per_carton, item.small_unit_label)
        : '',
      unit_price: item?.unit_price ?? '',
      line_total: item?.total ?? '',
    }));
  });

  const suffix = [
    filters.brokerName,
    filters.fromDate ? `tu_${filters.fromDate}` : '',
    filters.toDate ? `den_${filters.toDate}` : '',
  ]
    .filter(Boolean)
    .join('_');

  exportToExcel(
    [
      { title: 'STT', dataIndex: 'order_index' },
      { title: 'Khách hàng', dataIndex: 'customer_name' },
      { title: 'Nhà môi giới', dataIndex: 'broker_name' },
      { title: 'Trạng thái', dataIndex: 'payment_status' },
      {
        title: 'Ngày bán',
        dataIndex: 'sale_date',
        render: (value: string) => (value ? formatDate(value) : ''),
      },

      { title: 'Tên sản phẩm', dataIndex: 'product_name' },
      { title: 'Kho', dataIndex: 'warehouse_name' },
      { title: 'NCC', dataIndex: 'supplier' },
      { title: 'Lô', dataIndex: 'batch' },
      { title: 'Đơn vị', dataIndex: 'small_unit_label' },
      { title: 'Số lượng', dataIndex: 'quantity' },
      { title: 'Đơn giá (vnđ)', dataIndex: 'unit_price', render: renderCurrencyCell },
      { title: 'Thành tiền (vnđ)', dataIndex: 'line_total', render: renderCurrencyCell },
      { title: 'Tổng đơn (vnđ)', dataIndex: 'order_total', render: renderCurrencyCell },
    ],
    rows,
    `Thong_ke_doanh_so${suffix ? `_${suffix}` : ''}_${dayjs().format('YYYYMMDD_HHmmss')}`,
    'Thong ke doanh so',
    merges
  );
};
