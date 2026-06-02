import { Form, Popconfirm, Tag, type TableProps } from 'antd';
import { useMemo, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { TableSection } from '@/components/organisms/table-section';
import { useAppNotification } from '@/components/templates/notification';
import { useGetSalesReport, useGetSalesReportBrokers } from '@/hooks/api/sales-report';
import { salesReportsService } from '@/services/salesReports.service';
import { paymentStatusLabels, saleTypeLabels } from '@/constants/options';
import { sttColumn } from '@/utils/tableColumns';
import {
  formatCartonPiecesPlain,
  formatCurrency,
  formatDate,
  getErrorMessage,
  toApiDate,
} from '@/utils/format';
import { mapSaleDetail, SaleOrderDetail } from '@/pages/sales/types';
import { SalesReportFilterForm } from './SalesReportFilterForm';
import { exportSalesReportExcel } from './utils';

const SalesReportPage = () => {
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { error } = useAppNotification();

  const queryFilters = {
    brokerName: filters.brokerName,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    payment_status: filters.payment_status,
  };
  const { data: salesRes, isLoading } = useGetSalesReport(queryFilters);
  const { data: brokersRes } = useGetSalesReportBrokers();

  const data: SaleOrderDetail[] = useMemo(
    () => (salesRes?.data || []).map(mapSaleDetail),
    [salesRes]
  );
  const brokerOptions = useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    (brokersRes?.data || []).forEach(option => {
      const name = String(option.value || option.label || '').trim();
      if (!name) return;
      const key = name.toLocaleLowerCase('vi');
      if (!map.has(key)) map.set(key, { label: name, value: name });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [brokersRes]);

  const isFiltering = Object.keys(filters).some(k => filters[k] !== undefined && filters[k] !== '');
  const totalRevenue = data.reduce((sum, order) => sum + order.total_amount, 0);

  const onSearch = (values: any) => {
    if (values.fromDate && values.toDate && values.fromDate.isAfter(values.toDate, 'day')) {
      error({
        message: 'Khoảng ngày không hợp lệ',
        description: 'Từ ngày không được lớn hơn Đến ngày',
      });
      return;
    }

    setFilters({
      brokerName: values.brokerName,
      fromDate: values.fromDate ? toApiDate(values.fromDate) : undefined,
      toDate: values.toDate ? toApiDate(values.toDate) : undefined,
      payment_status: values.payment_status,
    });
  };

  const onClear = () => {
    filterForm.resetFields();
    setFilters({});
  };

  const onExport = async () => {
    try {
      const res = await salesReportsService.list(queryFilters);
      const orders = (res.data?.data || []).map(mapSaleDetail);
      exportSalesReportExcel(orders, filters);
    } catch (e: any) {
      error({
        message: 'Lỗi xuất Excel',
        description: getErrorMessage(e, 'Không thể xuất thống kê doanh số'),
      });
    }
  };

  const columns: TableProps<SaleOrderDetail>['columns'] = [
    sttColumn,
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 220,
      render: (value: string) => (
        <div>
          <div className="font-medium">{value}</div>
        </div>
      ),
    },
    {
      title: 'Nhà môi giới',
      dataIndex: 'broker_name',
      key: 'broker_name',
      width: 180,
      render: (value: string | null) => value || '-',
    },
    {
      title: 'Loại bán',
      dataIndex: 'sale_type',
      key: 'sale_type',
      width: 140,
      render: (value: string) => {
        const info = saleTypeLabels[value] || { label: value, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 150,
      render: (value: string, record) => {
        const info = record.returned
          ? { label: 'Đã hoàn hàng', color: 'red' }
          : paymentStatusLabels[value] || { label: value, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Ngày bán',
      dataIndex: 'sale_date',
      key: 'sale_date',
      width: 120,
      render: (value: string) => (value ? formatDate(value) : ''),
    },
    {
      title: 'Số sản phẩm',
      dataIndex: 'items_count',
      key: 'items_count',
      width: 120,
      align: 'center',
    },
    {
      title: 'Tổng tiền (vnđ)',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 150,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
  ];

  const filterSummary = (() => {
    const parts: { label: string; value: string }[] = [];
    if (filters.brokerName) parts.push({ label: 'Nhà môi giới', value: filters.brokerName });
    if (filters.fromDate) parts.push({ label: 'Từ ngày', value: filters.fromDate });
    if (filters.toDate) parts.push({ label: 'Đến ngày', value: filters.toDate });
    if (filters.payment_status) {
      parts.push({
        label: 'Trạng thái',
        value: paymentStatusLabels[filters.payment_status]?.label || filters.payment_status,
      });
    }
    return parts;
  })();

  return (
    <div className="sales-report-page">
      <SalesReportFilterForm
        form={filterForm}
        loading={isLoading}
        brokerOptions={brokerOptions}
        onSearch={onSearch}
        onClear={onClear}
      />

      <TableSection
        totalLabel="Tổng số đơn đã bán"
        totalCount={data.length}
        isFiltering={isFiltering}
        extraInfo={
          <div className="text-lg font-medium">
            Doanh số: <span className="text-primary">{formatCurrency(totalRevenue)} vnđ</span>
          </div>
        }
        extraActions={
          isFiltering ? (
            <Popconfirm
              title="Xuất Excel với bộ lọc hiện tại?"
              description={
                <div style={{ maxWidth: 320 }}>
                  <div className="mb-1">Sẽ xuất data theo filter:</div>
                  <ul className="pl-4 m-0 list-disc">
                    {filterSummary.map(f => (
                      <li key={f.label} className="break-words">
                        <span className="font-medium">{f.label}:</span> {f.value}
                      </li>
                    ))}
                  </ul>
                </div>
              }
              onConfirm={onExport}
              okText="Xuất"
              cancelText="Hủy"
            >
              <AppButton icon={<FiDownload />} type="default">
                Xuất Excel
              </AppButton>
            </Popconfirm>
          ) : (
            <AppButton icon={<FiDownload />} type="default" onClick={onExport}>
              Xuất Excel
            </AppButton>
          )
        }
        columns={columns}
        dataSource={data}
        loading={isLoading}
        scroll={{ x: 1100 }}
        expandable={{
          rowExpandable: record => record.items.length > 0,
          expandedRowRender: record => (
            <div className="py-2 pl-10 pr-4">
              <div className="mb-2 text-sm font-medium">Chi tiết sản phẩm</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left bg-gray-50">
                      <th className="px-3 py-2 font-medium text-center border">STT</th>
                      <th className="px-3 py-2 font-medium border">Tên sản phẩm</th>
                      <th className="px-3 py-2 font-medium border">Kho</th>
                      <th className="px-3 py-2 font-medium border">NCC</th>
                      <th className="px-3 py-2 font-medium border">Lô</th>
                      <th className="px-3 py-2 font-medium border">Đơn vị</th>
                      <th className="px-3 py-2 font-medium border">Số lượng</th>
                      <th className="px-3 py-2 font-medium text-right border">Đơn giá (vnđ)</th>
                      <th className="px-3 py-2 font-medium text-right border">Thành tiền (vnđ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.items.map((item, index) => (
                      <tr key={item._clientId}>
                        <td className="px-3 py-2 text-center border">{index + 1}</td>
                        <td className="px-3 py-2 border">{item.product_name}</td>
                        <td className="px-3 py-2 border">{item.warehouse_name || '-'}</td>
                        <td className="px-3 py-2 border">{item.supplier || '-'}</td>
                        <td className="px-3 py-2 border">{item.batch || '-'}</td>
                        <td className="px-3 py-2 border">{item.small_unit_label || '-'}</td>
                        <td className="px-3 py-2 border">
                          {formatCartonPiecesPlain(
                            item.quantity,
                            item.units_per_carton,
                            item.small_unit_label
                          )}
                        </td>
                        <td className="px-3 py-2 text-right border">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-3 py-2 text-right border">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ),
        }}
      />
    </div>
  );
};

export default SalesReportPage;
