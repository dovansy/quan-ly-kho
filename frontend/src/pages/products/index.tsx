import { AppButton } from '@/components/atoms/AppButton';
import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppInput } from '@/components/atoms/AppInput';
import { AppInputNumber } from '@/components/atoms/AppInput/InputNumber';
import { AppSelect } from '@/components/atoms/AppSelect';
import { ActionColumn } from '@/components/molecules/action-column';
import { CrudModal } from '@/components/organisms/crud-modal';
import { FilterSection } from '@/components/organisms/filter-section';
import { TableSection } from '@/components/organisms/table-section';
import { unitOptions } from '@/constants/options';
import { DATE_FORMAT } from '@/constants/format';
import { Unit } from '@/constants/enums';
import { useGetProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useGetProductOptions, useGetBatches } from '@/hooks/api/products';
import { useGetWarehouseList } from '@/hooks/api/warehouses';
import { sttColumn } from '@/utils/tableColumns';
import { formatCurrency, formatNumber, formatDate } from '@/utils/format';
import { Col, Form, Row, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { FiSearch, FiPlus, FiTrash2 } from 'react-icons/fi';

interface UnitEntry {
  unit: Unit;
  quantity: number;
  conversionRate: number; // 1 đơn vị này = bao nhiêu hộp
}

interface Product {
  key: string;
  id: number;
  name: string;
  category: string;
  warehouse: string;
  quantity: number;
  unitEntries: UnitEntry[];
  batch: string;
  importedBy: string;
  unitPrice: number;
  expiryDate: string;
  createdAt: string;
}

const mapProduct = (p: any): Product => ({
  key: String(p.id),
  id: p.id,
  name: p.name,
  category: p.category,
  warehouse: p.warehouse_name || '',
  quantity: p.quantity,
  unitEntries: (p.unitEntries || []).map((e: any) => ({
    unit: e.unit,
    quantity: e.quantity,
    conversionRate: e.conversionRate || e.conversion_rate || 1,
  })),
  batch: p.batch || '',
  importedBy: p.imported_by || p.importedBy || '',
  unitPrice: Number(p.unit_price || p.unitPrice) || 0,
  expiryDate: p.expiry_date || p.expiryDate || '',
  createdAt: p.createdAt || p.created_at || '',
});

const EMPTY_ENTRY: UnitEntry = { unit: Unit.HOP, quantity: 0, conversionRate: 1 };

const calcTotalQuantity = (entries: UnitEntry[]): number => {
  return entries.reduce((sum, e) => sum + e.quantity * e.conversionRate, 0);
};

const formatUnitEntries = (entries: UnitEntry[]): string => {
  return entries
    .filter(e => e.quantity > 0)
    .map(e => {
      const rate = e.conversionRate !== 1 ? ` (×${e.conversionRate})` : '';
      return `${formatNumber(e.quantity)} ${e.unit}${rate}`;
    })
    .join(' + ');
};

const ProductsPage = () => {
  const [filterForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [filters, setFilters] = useState<{ keyword?: string; category?: string; warehouse?: string }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Product | null>(null);
  const [unitEntries, setUnitEntries] = useState<UnitEntry[]>([{ ...EMPTY_ENTRY }]);
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  const { data: productsResponse, isLoading } = useGetProducts(filters);
  const { data: optionsRes } = useGetProductOptions();
  const { data: warehouseListRes } = useGetWarehouseList();
  const { data: allProductsRes } = useGetProducts({ limit: 1000 });
  const { data: batchesRes } = useGetBatches(selectedName, selectedWarehouse);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const categoryOptions = optionsRes?.data?.categories || [];
  const warehouseOptions = warehouseListRes?.data || [];
  const supplierOptions = optionsRes?.data?.suppliers || [];
  const batchOptions = batchesRes?.data || [];

  // Danh sách SP đã có để search trong modal
  const allProducts = (allProductsRes?.data || []).map(mapProduct);
  const productNameOptions = allProducts.map(p => ({ label: p.name, value: p.name }));

  const filteredData: Product[] = (productsResponse?.data || []).map(mapProduct);
  const loading = isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const onSearch = (values: any) => {
    const { keyword, category, warehouse } = values;
    setFilters({ keyword, category, warehouse });
  };

  const handleClearFilter = () => {
    filterForm.resetFields();
    setFilters({});
  };

  // Khi chọn SP từ dropdown → auto-fill category + cập nhật selectedName ngay
  const handleProductNameSelect = (value: string) => {
    setSelectedName(value);
    modalForm.setFieldValue('batch', undefined);
    const existing = allProducts.find(p => p.name === value);
    if (existing) {
      modalForm.setFieldsValue({ category: existing.category });
    }
  };

  // Khi blur ra ngoài input tên SP (gõ tay xong) → cập nhật selectedName
  const handleProductNameBlur = () => {
    const value = modalForm.getFieldValue('name') || '';
    if (value !== selectedName) {
      setSelectedName(value);
      modalForm.setFieldValue('batch', undefined);
    }
  };

  // Khi chọn kho từ dropdown → cập nhật selectedWarehouse ngay
  const handleWarehouseSelect = (value: string) => {
    setSelectedWarehouse(value);
    modalForm.setFieldValue('batch', undefined);
  };

  // Khi blur ra ngoài input kho (gõ tay xong) → cập nhật selectedWarehouse
  const handleWarehouseBlur = () => {
    const value = modalForm.getFieldValue('warehouse') || '';
    if (value !== selectedWarehouse) {
      setSelectedWarehouse(value);
      modalForm.setFieldValue('batch', undefined);
    }
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    modalForm.resetFields();
    setUnitEntries([{ ...EMPTY_ENTRY }]);
    setSelectedName('');
    setSelectedWarehouse('');
    setModalOpen(true);
  };

  const onOpenEdit = (record: Product) => {
    setEditingRecord(record);
    setSelectedName(record.name);
    setSelectedWarehouse(record.warehouse);
    modalForm.setFieldsValue({
      name: record.name,
      category: record.category,
      warehouse: record.warehouse,
      batch: record.batch,
      unitPrice: record.unitPrice,
      importedBy: record.importedBy,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : undefined,
    });
    setUnitEntries([...record.unitEntries]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingRecord(null);
    modalForm.resetFields();
    setUnitEntries([{ ...EMPTY_ENTRY }]);
    setSelectedName('');
    setSelectedWarehouse('');
    setModalOpen(false);
  };

  const handleDelete = (record: Product) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => {
        message.success('Xóa sản phẩm thành công');
      },
      onError: () => {
        message.error('Không thể xóa sản phẩm');
      },
    });
  };

  const handleAddEntry = () => {
    setUnitEntries([...unitEntries, { ...EMPTY_ENTRY }]);
  };

  const handleRemoveEntry = (index: number) => {
    if (unitEntries.length <= 1) return;
    setUnitEntries(unitEntries.filter((_, i) => i !== index));
  };

  const handleEntryChange = (index: number, field: keyof UnitEntry, value: any) => {
    const updated = [...unitEntries];
    updated[index] = { ...updated[index], [field]: value };
    setUnitEntries(updated);
  };

  const onSubmit = () => {
    modalForm.validateFields().then(values => {
      const validEntries = unitEntries.filter(e => e.quantity > 0);
      if (validEntries.length === 0) {
        message.warning('Vui lòng nhập số lượng cho ít nhất một đơn vị');
        return;
      }

      const payload = {
        name: values.name,
        category: values.category,
        warehouse: values.warehouse,
        batch: values.batch,
        unitEntries: validEntries.map(e => ({
          unit: e.unit,
          quantity: e.quantity,
          conversionRate: e.conversionRate,
        })),
        unitPrice: values.unitPrice,
        importedBy: values.importedBy,
        supplier: values.supplier,
        expiryDate: values.expiryDate ? dayjs(values.expiryDate).format('YYYY-MM-DD') : undefined,
      };

      if (editingRecord) {
        updateMutation.mutate(
          { id: editingRecord.id, data: payload },
          {
            onSuccess: () => { message.success('Cập nhật sản phẩm thành công'); closeModal(); },
            onError: () => message.error('Không thể cập nhật sản phẩm'),
          },
        );
      } else {
        // Backend tự kiểm tra: trùng tên + kho + lô → cộng dồn, ngược lại tạo mới
        createMutation.mutate(payload, {
          onSuccess: (res) => {
            const msg = res.data.message?.includes('Stock added')
              ? `Nhập thêm "${values.name}" vào kho thành công`
              : 'Thêm sản phẩm mới thành công';
            message.success(msg);
            closeModal();
          },
          onError: () => message.error('Không thể thêm sản phẩm'),
        });
      }
    });
  };

  const columns = [
    sttColumn,
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-bold">{text}</span>,
    },
    {
      title: 'Loại sản phẩm',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    { title: 'Kho', dataIndex: 'warehouse', key: 'warehouse' },
    {
      title: 'Lô',
      dataIndex: 'batch',
      key: 'batch',
      render: (text: string) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: 'Số lượng nhập',
      dataIndex: 'unitEntries',
      key: 'unitEntries',
      render: (entries: UnitEntry[]) => formatUnitEntries(entries),
    },
    {
      title: 'Tổng (hộp)',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (val: number) => formatNumber(val),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Hạn dùng',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      align: 'center' as const,
      render: (date: string) => {
        if (!date) return <span className="text-gray-400">-</span>;
        const diff = dayjs(date).diff(dayjs(), 'day');
        let color = 'processing';
        if (diff < 0) color = 'error';
        else if (diff < 90) color = 'warning';
        return <Tag color={color}>{formatDate(date)}</Tag>;
      },
    },
    { title: 'Người nhập', dataIndex: 'importedBy', key: 'importedBy' },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center' as const,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center' as const,
      width: 150,
      render: (_: any, record: Product) => (
        <ActionColumn
          onEdit={() => onOpenEdit(record)}
          onDelete={() => handleDelete(record)}
          deleteTitle="Xóa sản phẩm"
          deleteDescription={`Bạn có chắc muốn xóa "${record.name}"?`}
        />
      ),
    },
  ];

  return (
    <div className="products-page">
      <FilterSection
        form={filterForm}
        onSearch={onSearch}
        onClear={handleClearFilter}
        loading={loading}
      >
        <Form.Item name="keyword" label="Tìm kiếm sản phẩm" className="flex-1 mb-0">
          <AppInput placeholder="Nhập tên sản phẩm..." prefix={<FiSearch />} />
        </Form.Item>
        <Form.Item name="category" label="Loại sản phẩm" className="w-[200px] mb-0">
          <AppSelect
            allowClear
            showSearch
            placeholder="Chọn loại"
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            options={categoryOptions}
          />
        </Form.Item>
        <Form.Item name="warehouse" label="Kho" className="w-[200px] mb-0">
          <AppSelect
            allowClear
            showSearch
            placeholder="Chọn kho"
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            options={warehouseOptions}
          />
        </Form.Item>
      </FilterSection>

      <TableSection
        totalLabel="Tổng số sản phẩm"
        totalCount={filteredData.length}
        addLabel="Thêm sản phẩm"
        onAdd={openCreateModal}
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        scroll={{ x: 1200 }}
      />

      <CrudModal
        open={modalOpen}
        title={editingRecord ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        onCancel={closeModal}
        onSubmit={onSubmit}
        submitLabel={editingRecord ? 'Cập nhật' : 'Thêm mới'}
        width={700}
      >
        <Form form={modalForm} layout="vertical" className="pt-4" autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Tên sản phẩm"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
              >
                <AppAutoComplete
                  placeholder="Tìm sản phẩm đã có hoặc nhập tên mới"
                  options={productNameOptions}
                  onSelect={handleProductNameSelect}
                  onBlur={handleProductNameBlur}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="category"
                label="Loại sản phẩm"
                rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn loại sản phẩm' }]}
              >
                <AppAutoComplete
                  placeholder="Nhập hoặc chọn loại sản phẩm"
                  options={categoryOptions}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="warehouse"
                label="Kho"
                rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn kho' }]}
              >
                <AppAutoComplete
                  placeholder="Nhập hoặc chọn kho"
                  options={warehouseOptions}
                  onSelect={handleWarehouseSelect}
                  onBlur={handleWarehouseBlur}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="batch"
                label="Lô"
                rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn lô' }]}
              >
                <AppAutoComplete
                  placeholder={selectedName || selectedWarehouse ? 'Chọn lô hoặc nhập mới' : 'Nhập tên SP và kho trước'}
                  options={batchOptions}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="supplier"
                label="Nhà cung cấp"
                rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn nhà cung cấp' }]}
              >
                <AppAutoComplete
                  placeholder="Nhập hoặc chọn nhà cung cấp"
                  options={supplierOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="expiryDate" label="Ngày hết hạn" rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}>
                <AppDatePicker
                  placeholder="Chọn ngày hết hạn"
                  format={DATE_FORMAT.DISPLAY}
                  className="w-full"
                  disabledDate={(current) => current && current.isBefore(dayjs(), 'day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Số lượng nhập</span>
              <AppButton type="primary" size="small" icon={<FiPlus />} onClick={handleAddEntry}>
                Thêm đơn vị
              </AppButton>
            </div>

            {unitEntries.map((entry, index) => (
              <div key={index} className="flex items-center gap-3 mb-3">
                <div className="w-[120px]">
                  <AppInputNumber
                    placeholder="Số lượng"
                    decimalScale={0}
                    value={entry.quantity}
                    onValueChange={val => handleEntryChange(index, 'quantity', val.floatValue || 0)}
                    className="w-full"
                  />
                </div>
                <div className="w-[110px]">
                  <AppSelect
                    placeholder="Đơn vị"
                    options={unitOptions}
                    value={entry.unit}
                    onChange={val => {
                      handleEntryChange(index, 'unit', val);
                      if (val === Unit.HOP) handleEntryChange(index, 'conversionRate', 1);
                    }}
                    className="w-full"
                  />
                </div>
                {entry.unit !== Unit.HOP && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <span className="whitespace-nowrap">× 1 {entry.unit} =</span>
                    <div className="w-[70px]">
                      <AppInputNumber
                        decimalScale={0}
                        value={entry.conversionRate}
                        onValueChange={val =>
                          handleEntryChange(index, 'conversionRate', val.floatValue || 1)
                        }
                        className="w-full"
                      />
                    </div>
                    <span className="whitespace-nowrap">hộp</span>
                  </div>
                )}
                <span className="ml-auto text-sm text-gray-500 whitespace-nowrap">
                  = {formatNumber(entry.quantity * entry.conversionRate)} hộp
                </span>
                {unitEntries.length > 1 && (
                  <AppButton
                    type="text"
                    color="red"
                    icon={<FiTrash2 />}
                    onClick={() => handleRemoveEntry(index)}
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end mt-1 text-base font-bold">
              Tổng: {formatNumber(calcTotalQuantity(unitEntries))} hộp
            </div>
          </div>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="unitPrice"
                label="Đơn giá (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập đơn giá' }]}
              >
                <AppInputNumber
                  placeholder="Nhập đơn giá"
                  decimalScale={0}
                  className="w-full"
                  suffix=" đ"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="importedBy"
                label="Người nhập kho"
                rules={[{ required: true, message: 'Vui lòng nhập tên người nhập kho' }]}
              >
                <AppInput placeholder="Nhập tên người nhập kho" autoComplete="new-password" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </CrudModal>
    </div>
  );
};

export default ProductsPage;
