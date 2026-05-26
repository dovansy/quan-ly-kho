import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppButton } from '@/components/atoms/AppButton';
import { AppSelect } from '@/components/atoms/AppSelect';
import { TableSection } from '@/components/organisms/table-section/TableSection';
import { useGetInventory, useGetInventoryFilters } from '@/hooks/api/inventory';
import { useGetProducts } from '@/hooks/api/products';
import { useGetWarehouseList } from '@/hooks/api/warehouses';
import { useAppNotification } from '@/components/templates/notification';
import { inventoryService } from '@/services/inventory.service';
import useDebounce from '@/hooks/useDebounce';
import { sttColumn } from '@/utils/tableColumns';
import { renderExpiryTag } from '@/utils/expiry';
import { formatCartonPiecesPlain, formatDate, getErrorMessage } from '@/utils/format';
import { renderCartonPieces } from '@/utils/quantity';
import { exportToExcel } from '@/utils/exportExcel';
import { Col, Form, Popconfirm, Row, Space, Tag, Tooltip, type TableProps } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { useState } from 'react';
import { FiDownload, FiRepeat, FiRotateCcw, FiSearch } from 'react-icons/fi';
import { TransferModal } from './TransferModal';

const InventoryPage = () => {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [keywordInput, setKeywordInput] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferInitialId, setTransferInitialId] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<{
    sort_by?: 'product_name' | 'warehouse_name' | 'nearest_expiry';
    sort_order?: 'asc' | 'desc';
  }>({});
  const debouncedKeyword = useDebounce(keywordInput, 300);
  const { error } = useAppNotification();
  const isFiltering = Object.keys(filters).some(k => filters[k] !== undefined && filters[k] !== '');

  const selectedWithKeyword = debouncedKeyword
    ? { ...selected, keyword: debouncedKeyword }
    : selected;

  const { data: inventoryRes, isLoading } = useGetInventory({ ...filters, ...sort });
  const { data: filtersRes } = useGetInventoryFilters(selectedWithKeyword);
  const { data: warehouseListRes } = useGetWarehouseList();
  const { data: productsRes } = useGetProducts({ limit: 1000 });
  const productNameOpts = (productsRes?.data || []).map((p: any) => ({
    label: p.name,
    value: p.name,
  }));

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

  const handleExportExcel = async () => {
    try {
      const res = await inventoryService.list({
        keyword: filters.keyword,
        warehouse_id: filters.warehouse_id ? Number(filters.warehouse_id) : undefined,
        category: filters.category,
        supplier: filters.supplier,
        batch: filters.batch,
      });
      const fullData = res.data?.data || [];
      const sorted = [...fullData].sort((a: any, b: any) =>
        (a.product_name || '').localeCompare(b.product_name || '', 'vi')
      );

      const productTotals: Record<string, number> = {};
      sorted.forEach((item: any) => {
        const name = item.product_name || 'Khác';
        if (!productTotals[name]) productTotals[name] = 0;
        productTotals[name] += item.stock_pieces || 0;
      });

      let currentProductName = '';
      sorted.forEach((item: any) => {
        const name = item.product_name || 'Khác';
        if (name !== currentProductName) {
          const totalVal = productTotals[name];
          item.total = formatCartonPiecesPlain(
            totalVal,
            item.units_per_carton,
            item.small_unit?.label
          );
          currentProductName = name;
        } else {
          item.total = '';
        }
      });

      const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
      let mergeStartIdx = 0;
      for (let i = 1; i <= sorted.length; i++) {
        const name = sorted[i]?.product_name || '';
        const prevName = sorted[i - 1]?.product_name || 'Khác';

        if (i === sorted.length || name !== prevName) {
          if (i - 1 > mergeStartIdx) {
            merges.push({
              s: { r: mergeStartIdx + 1, c: 9 },
              e: { r: i - 1 + 1, c: 9 },
            });
          }
          mergeStartIdx = i;
        }
      }

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
          {
            title: 'Tổng',
            dataIndex: 'total',
          },
        ],
        sorted,
        `Ton_kho_${dayjs().format('YYYYMMDD_HHmmss')}`,
        'Ton kho',
        merges
      );
    } catch (e: any) {
      error({
        message: 'Lỗi xuất Excel',
        description: getErrorMessage(e, 'Không thể xuất'),
      });
    }
  };

  const filterSummary = (() => {
    const parts: { label: string; value: string }[] = [];
    if (filters.warehouse_id) {
      const wid = Number(filters.warehouse_id);
      const fromAll = (warehouseListRes?.data || []).find((o: any) => o.id === wid);
      const fromOpts = filterOptions.warehouses.find((o: any) => o.value === wid);
      const label = fromAll?.label || fromOpts?.label || `#${wid}`;
      parts.push({ label: 'Kho', value: label });
    }
    if (filters.category) parts.push({ label: 'Loại sản phẩm', value: filters.category });
    if (filters.supplier) parts.push({ label: 'NCC', value: filters.supplier });
    if (filters.batch) parts.push({ label: 'Lô', value: filters.batch });
    if (filters.keyword) parts.push({ label: 'Tìm kiếm nhanh', value: `"${filters.keyword}"` });
    return parts;
  })();

  const columns = [
    sttColumn,
    {
      title: 'Tên sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      sorter: true,
      sortOrder: (sort.sort_by === 'product_name'
        ? sort.sort_order === 'asc'
          ? 'ascend'
          : 'descend'
        : null) as SortOrder,
      render: (text: string, record: any) => (
        <div className="w-[200px]">
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
      sortOrder: (sort.sort_by === 'warehouse_name'
        ? sort.sort_order === 'asc'
          ? 'ascend'
          : 'descend'
        : null) as SortOrder,
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
      width: '150px',
      align: 'center' as const,
      render: (t: string) => <Tag color="magenta">{t}</Tag>,
    },
    {
      title: 'HSD',
      dataIndex: 'nearest_expiry',
      key: 'nearest_expiry',
      align: 'center' as const,
      sorter: true,
      sortOrder: (sort.sort_by === 'nearest_expiry'
        ? sort.sort_order === 'asc'
          ? 'ascend'
          : 'descend'
        : null) as SortOrder,
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
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center' as const,
      width: 100,
      render: (_: any, record: any) => {
        const avail = Number(record.available_pieces ?? record.stock_pieces) || 0;
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip title="Chuyển kho">
              <AppButton
                type="text"
                size="small"
                icon={<FiRepeat />}
                disabled={avail <= 0}
                onClick={() => {
                  setTransferInitialId(record.id);
                  setTransferOpen(true);
                }}
              />
            </Tooltip>
          </div>
        );
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
              <Form.Item name="supplier" label="NCC">
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
                <AppAutoComplete
                  placeholder="Nhập tên sản phẩm..."
                  options={productNameOpts}
                  filterOption={(i, o) =>
                    ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
                  }
                  onChange={(v: any) => setKeywordInput(typeof v === 'string' ? v : '')}
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
          <>
            {isFiltering ? (
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
                onConfirm={handleExportExcel}
                okText="Xuất"
                cancelText="Hủy"
              >
                <AppButton icon={<FiDownload />} type="default">
                  Xuất Excel
                </AppButton>
              </Popconfirm>
            ) : (
              <AppButton icon={<FiDownload />} type="default" onClick={handleExportExcel}>
                Xuất Excel
              </AppButton>
            )}
            <AppButton
              icon={<FiRepeat />}
              type="primary"
              onClick={() => {
                setTransferInitialId(undefined);
                setTransferOpen(true);
              }}
            >
              Chuyển kho
            </AppButton>
          </>
        }
        columns={columns}
        dataSource={dataSource}
        loading={isLoading}
        scroll={{ x: 1200 }}
        onChange={handleTableChange}
      />

      <TransferModal
        open={transferOpen}
        inventoryList={dataSource}
        initialInventoryId={transferInitialId}
        warehouseOptions={(warehouseListRes?.data || []).map((w: any) => ({
          label: w.label,
          value: w.id,
        }))}
        onClose={() => {
          setTransferOpen(false);
          setTransferInitialId(undefined);
        }}
      />
    </div>
  );
};

export default InventoryPage;
