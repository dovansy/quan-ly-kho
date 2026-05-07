import { AppButton } from '@/components/atoms/AppButton';
import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { TableSection } from '@/components/organisms/table-section/TableSection';
import { useGetInventory, useGetInventoryFilters } from '@/hooks/api/inventory';
import useDebounce from '@/hooks/useDebounce';
import { sttColumn } from '@/utils/tableColumns';
import { renderExpiryTag } from '@/utils/expiry';
import { formatCartonPiecesPlain, formatDate } from '@/utils/format';
import { renderCartonPieces } from '@/utils/quantity';
import { exportToExcel } from '@/utils/exportExcel';
import { Col, Form, Row, Space, Tag, type TableProps } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { FiDownload, FiRotateCcw, FiSearch } from 'react-icons/fi';

const InventoryPage = () => {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [keywordInput, setKeywordInput] = useState('');
  const [sort, setSort] = useState<{
    sort_by?: 'product_name' | 'warehouse_name' | 'nearest_expiry';
    sort_order?: 'asc' | 'desc';
  }>({});
  const debouncedKeyword = useDebounce(keywordInput, 300);

  const selectedWithKeyword = debouncedKeyword
    ? { ...selected, keyword: debouncedKeyword }
    : selected;

  const { data: inventoryRes, isLoading } = useGetInventory({ ...filters, ...sort });
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
    setSort({});
  };

  const handleTableChange: TableProps<any>['onChange'] = (_pag, _filt, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (
      s &&
      s.order &&
      (s.field === 'product_name' || s.field === 'warehouse_name' || s.field === 'nearest_expiry')
    ) {
      setSort({
        sort_by: s.field,
        sort_order: s.order === 'ascend' ? 'asc' : 'desc',
      });
    } else {
      setSort({});
    }
  };

  const handleExportExcel = () => {
    const sorted = [...dataSource].sort((a: any, b: any) =>
      (a.product_name || '').localeCompare(b.product_name || '', 'vi')
    );
    exportToExcel(
      [
        { title: 'STT', dataIndex: 'index' },
        { title: 'Tên sản phẩm', dataIndex: 'product_name' },
        { title: 'Đơn vị', dataIndex: 'small_unit', render: (u: any) => u?.label || '' },
        { title: 'Kho', dataIndex: 'warehouse_name' },
        { title: 'Loại sản phẩm', dataIndex: 'category' },
        { title: 'NCC', dataIndex: 'supplier' },
        { title: 'Lô', dataIndex: 'batch' },
        {
          title: 'Hạn dùng',
          dataIndex: 'nearest_expiry',
          render: (v: string) => (v ? formatDate(v) : ''),
        },
        {
          title: 'Tồn',
          dataIndex: 'stock_pieces',
          render: (val: number, record: any) =>
            formatCartonPiecesPlain(val, record.units_per_carton, record.small_unit?.label),
        },
      ],
      sorted,
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
      sorter: true,
      sortOrder:
        sort.sort_by === 'product_name' ? (sort.sort_order === 'asc' ? 'ascend' : 'descend') : null,
      render: (text: string, record: any) => (
        <div>
          <div className="font-bold">{text}</div>
          {record.small_unit?.label && (
            <div className="text-xs text-gray-500">{record.small_unit.label}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Kho',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      sorter: true,
      sortOrder:
        sort.sort_by === 'warehouse_name'
          ? sort.sort_order === 'asc'
            ? 'ascend'
            : 'descend'
          : null,
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
      render: (t: string) => <Tag color="geekblue">{t}</Tag>,
    },
    {
      title: 'HSD',
      dataIndex: 'nearest_expiry',
      key: 'nearest_expiry',
      align: 'center' as const,
      sorter: true,
      sortOrder:
        sort.sort_by === 'nearest_expiry'
          ? sort.sort_order === 'asc'
            ? 'ascend'
            : 'descend'
          : null,
      render: (date: string) => renderExpiryTag(date),
    },
    {
      title: 'Tồn',
      dataIndex: 'stock_pieces',
      key: 'stock_pieces',
      align: 'right' as const,
      render: (val: number, record: any) =>
        renderCartonPieces(val, record.units_per_carton, record.small_unit?.label),
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
        onChange={handleTableChange}
      />
    </div>
  );
};

export default InventoryPage;
