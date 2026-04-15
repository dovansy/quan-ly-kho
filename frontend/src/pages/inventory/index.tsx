import { AppButton } from '@/components/atoms/AppButton';
import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { AppTable } from '@/components/atoms/AppTable/AppTable';
import { StatCard } from '@/components/molecules/stat-card';
import { useGetInventory, useGetInventoryStats, useGetInventoryFilters } from '@/hooks/api/inventory';
import useDebounce from '@/hooks/useDebounce';
import { sttColumn } from '@/utils/tableColumns';
import { formatCurrency, formatDate } from '@/utils/format';
import { exportToExcel } from '@/utils/exportExcel';
import { Col, Form, Row, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  FiAlertCircle,
  FiBox,
  FiDollarSign,
  FiDownload,
  FiRotateCcw,
  FiSearch,
} from 'react-icons/fi';

const InventoryPage = () => {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [keywordInput, setKeywordInput] = useState('');
  const debouncedKeyword = useDebounce(keywordInput, 300);

  // Gộp selected + debounced keyword để gửi cho API filters
  const selectedWithKeyword = debouncedKeyword
    ? { ...selected, keyword: debouncedKeyword }
    : selected;

  const { data: inventoryRes, isLoading } = useGetInventory(filters);
  const { data: statsRes } = useGetInventoryStats(filters);
  const { data: filtersRes } = useGetInventoryFilters(selectedWithKeyword);

  const dataSource = inventoryRes?.data || [];
  const stats = {
    totalItems: Number(statsRes?.data?.totalItems) || 0,
    totalValue: Number(statsRes?.data?.totalValue) || 0,
    lowStockCount: Number(statsRes?.data?.lowStockCount) || 0,
  };
  const filterOptions = filtersRes?.data || { warehouses: [], categories: [], suppliers: [], batches: [] };

  // Khi thay đổi bất kỳ select nào → cập nhật selected để refetch options
  const handleSelectChange = (field: string, value: string | undefined) => {
    setSelected(prev => {
      const next = { ...prev };
      if (value) next[field] = value;
      else delete next[field];
      return next;
    });
  };

  const onFinish = (values: any) => {
    const params: Record<string, any> = {};
    if (values.warehouse) params.warehouse = values.warehouse;
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
        { title: 'Tên sản phẩm', dataIndex: 'name' },
        { title: 'Đơn vị', dataIndex: 'unit' },
        { title: 'Kho', dataIndex: 'warehouse' },
        { title: 'Loại sản phẩm', dataIndex: 'category' },
        { title: 'Nhà cung cấp', dataIndex: 'supplier' },
        { title: 'Lô', dataIndex: 'batch' },
        { title: 'Hạn dùng', dataIndex: 'expiryDate', render: (val: string) => val ? formatDate(val) : '' },
        { title: 'Ngày nhập', dataIndex: 'importDate' },
        { title: 'Số lượng', dataIndex: 'quantity' },
        { title: 'Đơn giá', dataIndex: 'price', render: (val: number) => Number(val) },
        { title: 'Thành tiền', dataIndex: 'price', render: (_: any, r: any) => Number(r.price) * Number(r.quantity) },
      ],
      dataSource,
      `Ton_kho_${dayjs().format('YYYYMMDD_HHmmss')}`,
      'Ton kho',
    );
  };

  const columns = [
    sttColumn,
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-bold">{text}</div>
          <div className="text-xs text-gray-500">{record.unit}</div>
        </div>
      ),
    },
    { title: 'Kho', dataIndex: 'warehouse', key: 'warehouse' },
    {
      title: 'Loại sản phẩm',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    { title: 'Nhà cung cấp', dataIndex: 'supplier', key: 'supplier' },
    {
      title: 'Lô',
      dataIndex: 'batch',
      key: 'batch',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Hạn dùng',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
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
    { title: 'Ngày nhập', dataIndex: 'importDate', key: 'importDate', align: 'center' as const },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (val: number, record: any) => (
        <span className={val < record.minStock ? 'text-error font-bold' : ''}>
          {val?.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      align: 'right' as const,
      render: (val: number) => formatCurrency(Number(val)),
    },
    {
      title: 'Thành tiền',
      key: 'total',
      align: 'right' as const,
      render: (_: any, record: any) => formatCurrency(Number(record.price) * Number(record.quantity)),
    },
  ];

  return (
    <div className="inventory-page">
      <Row gutter={[16, 16]} className="mb-6">
        <StatCard
          title="Tổng mặt hàng"
          value={stats.totalItems}
          prefix={<FiBox className="mr-2 text-primary" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Tổng giá trị kho"
          value={stats.totalValue}
          suffix="đ"
          prefix={<FiDollarSign className="mr-2 text-success" />}
          bgColor="bg-green-50"
        />
        <StatCard
          title="Sắp hết hạn / Tồn thấp"
          value={stats.lowStockCount}
          prefix={<FiAlertCircle className="mr-2" />}
          bgColor="bg-red-50"
          valueStyle={{ color: '#cf1322' }}
        />
      </Row>

      <div className="p-6 mb-6 bg-white rounded-lg shadow-sm filter-section">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item name="warehouse" label="Kho">
                <AppSelect
                  allowClear
                  showSearch
                  placeholder="Chọn kho"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={filterOptions.warehouses}
                  onChange={(val) => handleSelectChange('warehouse', val)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item name="category" label="Loại sản phẩm">
                <AppSelect
                  allowClear
                  showSearch
                  placeholder="Chọn loại sản phẩm"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={filterOptions.categories}
                  onChange={(val) => handleSelectChange('category', val)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item name="supplier" label="Nhà cung cấp">
                <AppSelect
                  allowClear
                  showSearch
                  placeholder="Chọn nhà cung cấp"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={filterOptions.suppliers}
                  onChange={(val) => handleSelectChange('supplier', val)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <Form.Item name="batch" label="Lô">
                <AppSelect
                  allowClear
                  showSearch
                  placeholder="Chọn số lô"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={filterOptions.batches}
                  onChange={(val) => handleSelectChange('batch', val)}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 16]} align="bottom">
            <Col xs={24} md={12} lg={16}>
              <Form.Item name="keyword" label="Tìm kiếm nhanh" className="mb-0">
                <AppInput
                  placeholder="Nhập tên sản phẩm hoặc mã..."
                  prefix={<FiSearch />}
                  onChange={(e) => setKeywordInput(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
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
                  <AppButton type="primary" htmlType="submit" icon={<FiSearch />} loading={isLoading}>
                    Tìm kiếm
                  </AppButton>
                </Space>
              </div>
            </Col>
          </Row>
        </Form>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm table-section">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-medium summary">
            Tổng số sản phẩm: <span className="text-primary">{dataSource.length}</span>
          </div>
          <AppButton icon={<FiDownload />} type="default" onClick={handleExportExcel}>
            Xuất Excel
          </AppButton>
        </div>
        <AppTable
          columns={columns}
          dataSource={dataSource}
          loading={isLoading}
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 10, total: dataSource.length, showSizeChanger: true }}
        />
      </div>
    </div>
  );
};

export default InventoryPage;
