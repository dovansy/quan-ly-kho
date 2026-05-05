import { AppButton } from '@/components/atoms/AppButton';
import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { TableSection } from '@/components/organisms/table-section/TableSection';
import { useGetInventory, useGetInventoryFilters } from '@/hooks/api/inventory';
import useDebounce from '@/hooks/useDebounce';
import { sttColumn } from '@/utils/tableColumns';
import { formatDate, formatNumber } from '@/utils/format';
import { exportToExcel } from '@/utils/exportExcel';
import { Col, Form, Row, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { FiDownload, FiRotateCcw, FiSearch } from 'react-icons/fi';

const InventoryPage = () => {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [keywordInput, setKeywordInput] = useState('');
  const debouncedKeyword = useDebounce(keywordInput, 300);

  const selectedWithKeyword = debouncedKeyword
    ? { ...selected, keyword: debouncedKeyword }
    : selected;

  const { data: inventoryRes, isLoading } = useGetInventory(filters);
  const { data: filtersRes } = useGetInventoryFilters(selectedWithKeyword);

  const dataSource = inventoryRes?.data || [];
  const filterOptions = filtersRes?.data || {
    warehouses: [],
    categories: [],
    suppliers: [],
    batches: [],
  };

  const handleSelectChange = (field: string, value: any) => {
    setSelected(prev => {
      const next = { ...prev };
      if (value !== undefined && value !== null && value !== '') next[field] = value;
      else delete next[field];
      return next;
    });
  };

  const onFinish = (values: any) => {
    const params: Record<string, any> = {};
    if (values.warehouse_id) params.warehouse_id = values.warehouse_id;
    if (values.category) params.category = values.category;
    if (values.supplier) params.supplier = values.supplier;
    if (values.batch) params.batch = values.batch;
    if (values.keyword) params.keyword = values.keyword;
    setFilters(params);
  };

  const onClear = () => {
    form.resetFields();
    setFilters({});
    setSelected({});
    setKeywordInput('');
  };

  const handleExportExcel = () => {
    exportToExcel(
      [
        { title: 'STT', dataIndex: 'index' },
        { title: 'Tên sản phẩm', dataIndex: 'product_name' },
        { title: 'Đơn vị', dataIndex: 'small_unit', render: (u: any) => u?.label || '' },
        { title: 'Kho', dataIndex: 'warehouse_name' },
        { title: 'Loại sản phẩm', dataIndex: 'category' },
        { title: 'Nhà cung cấp', dataIndex: 'supplier' },
        { title: 'Lô', dataIndex: 'batch' },
        {
          title: 'Hạn dùng',
          dataIndex: 'nearest_expiry',
          render: (v: string) => (v ? formatDate(v) : ''),
        },
        {
          title: 'Tồn',
          dataIndex: 'stock_pieces',
          render: (val: number, record: any) => {
            const total = Number(val) || 0;
            const upc = Number(record.units_per_carton) || 0;
            const unitLabel = record.small_unit?.label || '';
            if (upc > 1 && total > 0) {
              const cartons = Math.floor(total / upc);
              const pieces = total - cartons * upc;
              const parts: string[] = [];
              if (cartons > 0) parts.push(`${formatNumber(cartons)} Kiện × ${upc}`);
              if (pieces > 0) parts.push(`${formatNumber(pieces)} ${unitLabel}`);
              return `${parts.join(' + ')} = ${formatNumber(total)} ${unitLabel}`;
            }
            return `${formatNumber(total)} ${unitLabel}`;
          },
        },
      ],
      dataSource,
      `Ton_kho_${dayjs().format('YYYYMMDD_HHmmss')}`,
      'Ton kho'
    );
  };

  const columns = [
    sttColumn,
    {
      title: 'Tên sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-bold">{text}</div>
          {record.small_unit?.label && (
            <div className="text-xs text-gray-500">{record.small_unit.label}</div>
          )}
        </div>
      ),
    },
    { title: 'Kho', dataIndex: 'warehouse_name', key: 'warehouse_name' },
    {
      title: 'Loại',
      dataIndex: 'category',
      key: 'category',
      render: (t: string) => (t ? <Tag color="blue">{t}</Tag> : '-'),
    },
    { title: 'Nhà cung cấp', dataIndex: 'supplier', key: 'supplier' },
    {
      title: 'Lô',
      dataIndex: 'batch',
      key: 'batch',
      render: (t: string) => <Tag color="geekblue">{t}</Tag>,
    },
    {
      title: 'Hạn dùng gần nhất',
      dataIndex: 'nearest_expiry',
      key: 'nearest_expiry',
      align: 'center' as const,
      render: (date: string) => {
        if (!date) return '-';
        const diff = dayjs(date).diff(dayjs(), 'day');
        let color = 'processing';
        if (diff < 0) color = 'error';
        else if (diff < 30) color = 'warning';
        return <Tag color={color}>{formatDate(date)}</Tag>;
      },
    },
    {
      title: 'Tồn',
      dataIndex: 'stock_pieces',
      key: 'stock_pieces',
      align: 'right' as const,
      render: (val: number, record: any) => {
        const total = Number(val) || 0;
        const upc = Number(record.units_per_carton) || 0;
        const unitLabel = record.small_unit?.label || '';
        if (upc > 1 && total > 0) {
          const cartons = Math.floor(total / upc);
          const pieces = total - cartons * upc;
          const parts: string[] = [];
          if (cartons > 0) parts.push(`${formatNumber(cartons)} Kiện × ${upc}`);
          if (pieces > 0) parts.push(`${formatNumber(pieces)} ${unitLabel}`);
          return (
            <span>
              {parts.join(' + ')}{' '}
              <span className="text-gray-400">
                = {formatNumber(total)} {unitLabel}
              </span>
            </span>
          );
        }
        return `${formatNumber(total)} ${unitLabel}`;
      },
    },
  ];

  return (
    <div className="inventory-page">
      <div className="p-6 mb-6 bg-white rounded-lg shadow-sm filter-section">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="warehouse_id" label="Kho">
                <AppSelect
                  allowClear
                  showSearch
                  placeholder="Chọn kho"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={filterOptions.warehouses}
                  onChange={val => handleSelectChange('warehouse_id', val)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="category" label="Loại">
                <AppSelect
                  allowClear
                  showSearch
                  placeholder="Chọn loại"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={filterOptions.categories}
                  onChange={val => handleSelectChange('category', val)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="supplier" label="Nhà cung cấp">
                <AppSelect
                  allowClear
                  showSearch
                  placeholder="Chọn NCC"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={filterOptions.suppliers}
                  onChange={val => handleSelectChange('supplier', val)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="batch" label="Lô">
                <AppSelect
                  allowClear
                  showSearch
                  placeholder="Chọn lô"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={filterOptions.batches}
                  onChange={val => handleSelectChange('batch', val)}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 16]} align="bottom">
            <Col xs={24} md={16}>
              <Form.Item name="keyword" label="Tìm kiếm nhanh" className="mb-0">
                <AppInput
                  placeholder="Nhập tên sản phẩm..."
                  prefix={<FiSearch />}
                  onChange={e => setKeywordInput(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <div className="flex justify-end">
                <Space size="middle">
                  <AppButton
                    onClick={onClear}
                    icon={<FiRotateCcw />}
                    variant="outlined"
                    type="default"
                  >
                    Xóa bộ lọc
                  </AppButton>
                  <AppButton
                    type="primary"
                    htmlType="submit"
                    icon={<FiSearch />}
                    loading={isLoading}
                  >
                    Tìm kiếm
                  </AppButton>
                </Space>
              </div>
            </Col>
          </Row>
        </Form>
      </div>

      <TableSection
        totalLabel="Số sản phẩm tồn"
        totalCount={dataSource.length}
        extraActions={
          <AppButton icon={<FiDownload />} type="default" onClick={handleExportExcel}>
            Xuất Excel
          </AppButton>
        }
        columns={columns}
        dataSource={dataSource}
        loading={isLoading}
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default InventoryPage;
