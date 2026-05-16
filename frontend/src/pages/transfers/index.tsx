import { Form, Tag } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppSelect } from '@/components/atoms/AppSelect';
import { TableSection } from '@/components/organisms/table-section';
import { FilterSection } from '@/components/organisms/filter-section';
import { useGetTransfers } from '@/hooks/api/inventory';
import { useGetProducts } from '@/hooks/api/products';
import { useGetWarehouseList } from '@/hooks/api/warehouses';
import { DATE_FORMAT } from '@/constants/format';
import { sttColumn } from '@/utils/tableColumns';
import { formatCartonPiecesPlain, formatDate } from '@/utils/format';

const TransfersPage = () => {
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const isFiltering = Object.keys(filters).some(k => filters[k] !== undefined && filters[k] !== '');

  const { data: transfersRes, isLoading } = useGetTransfers({ ...filters, limit: 1000 });
  const { data: warehouseListRes } = useGetWarehouseList();
  const { data: productsRes } = useGetProducts({ limit: 1000 });

  const data = transfersRes?.data || [];
  const warehouseOptions = (warehouseListRes?.data || []).map((w: any) => ({
    label: w.label,
    value: w.id,
  }));
  const productNameOpts = (productsRes?.data || []).map((p: any) => ({
    label: p.name,
    value: p.name,
  }));

  const onSearch = (v: any) => {
    setFilters({
      keyword: v.keyword,
      warehouse_id_from: v.warehouse_id_from,
      warehouse_id_to: v.warehouse_id_to,
      transferDate: v.transferDate ? dayjs(v.transferDate).format('YYYY-MM-DD') : undefined,
    });
  };

  const onClear = () => {
    filterForm.resetFields();
    setFilters({});
  };

  const columns = [
    sttColumn,
    {
      title: 'Tên sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
      render: (t: string, r: any) => (
        <div>
          <div className="font-bold">{t}</div>
          {r.small_unit?.label && <div className="text-xs text-gray-500">{r.small_unit.label}</div>}
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'category',
      key: 'category',
      render: (t: string) => (t ? <Tag color="blue">{t}</Tag> : '-'),
    },
    { title: 'NCC', dataIndex: 'supplier', key: 'supplier' },
    {
      title: 'Lô',
      dataIndex: 'batch',
      key: 'batch',
      render: (t: string) => <Tag color="magenta">{t}</Tag>,
    },
    {
      title: 'Kho nguồn',
      dataIndex: 'warehouse_from_name',
      key: 'warehouse_from_name',
      render: (t: string) => <Tag color="orange">{t}</Tag>,
    },
    {
      title: 'Kho đích',
      dataIndex: 'warehouse_to_name',
      key: 'warehouse_to_name',
      render: (t: string) => <Tag color="green">{t}</Tag>,
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (q: number, r: any) =>
        formatCartonPiecesPlain(q, r.units_per_carton, r.small_unit?.label),
    },
    {
      title: 'Người chuyển',
      dataIndex: 'transferred_by',
      key: 'transferred_by',
      render: (t: string) => t || '-',
    },
    {
      title: 'Ngày chuyển',
      dataIndex: 'transfer_date',
      key: 'transfer_date',
      align: 'center' as const,
      render: (d: string) => (d ? formatDate(d) : '-'),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (n: string) => n || '-',
    },
  ];

  return (
    <div className="transfers-page">
      <FilterSection form={filterForm} onSearch={onSearch} onClear={onClear} loading={isLoading}>
        <Form.Item name="keyword" label="Tìm sản phẩm" className="flex-1 mb-0">
          <AppAutoComplete
            placeholder="Tên sản phẩm..."
            options={productNameOpts}
            filterOption={(i, o) =>
              ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="warehouse_id_from" label="Kho nguồn" className="w-[180px] mb-0">
          <AppSelect
            allowClear
            showSearch
            placeholder="Chọn kho nguồn"
            options={warehouseOptions}
            filterOption={(i, o) =>
              ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="warehouse_id_to" label="Kho đích" className="w-[180px] mb-0">
          <AppSelect
            allowClear
            showSearch
            placeholder="Chọn kho đích"
            options={warehouseOptions}
            filterOption={(i, o) =>
              ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="transferDate" label="Ngày chuyển" className="w-[180px] mb-0">
          <AppDatePicker
            allowClear
            placeholder="Chọn ngày"
            format={DATE_FORMAT.DISPLAY}
            className="w-full"
          />
        </Form.Item>
      </FilterSection>

      <TableSection
        totalLabel="Tổng số lần chuyển"
        totalCount={data.length}
        isFiltering={isFiltering}
        columns={columns}
        dataSource={data.map(d => ({ ...d, key: String(d.id) }))}
        loading={isLoading}
        scroll={{ x: 1400 }}
      />
    </div>
  );
};

export default TransfersPage;
