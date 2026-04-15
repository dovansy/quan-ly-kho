import { AppButton } from '@/components/atoms/AppButton';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppInput } from '@/components/atoms/AppInput';
import { AppInputNumber } from '@/components/atoms/AppInput/InputNumber';
import { AppSelect } from '@/components/atoms/AppSelect';
import { ActionColumn } from '@/components/molecules/action-column';
import { CrudModal } from '@/components/organisms/crud-modal';
import { FilterSection } from '@/components/organisms/filter-section';
import { StatCard } from '@/components/molecules/stat-card';
import { TableSection } from '@/components/organisms/table-section';
import { saleTypeOptions, saleTypeLabels, unitOptions, paidOptions } from '@/constants/options';
import { DATE_FORMAT } from '@/constants/format';
import { Unit } from '@/constants/enums';
import { useGetSales, useCreateSale, useUpdateSale, useDeleteSale } from '@/hooks/api/sales';
import { useGetProductList } from '@/hooks/api/products';
import { sttColumn } from '@/utils/tableColumns';
import { formatCurrency, formatDate, toApiDate } from '@/utils/format';
import { Col, Form, Row, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { FiPlus, FiSearch, FiTrash2, FiDollarSign, FiAlertCircle } from 'react-icons/fi';

interface SaleItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface SaleInvoice {
  key: string;
  id: number;
  invoiceCode: string;
  customerName: string;
  customerPhone: string;
  saleType: string;
  items: SaleItem[];
  totalAmount: number;
  paid: boolean;
  saleDate: string;
  createdBy: string;
}

const EMPTY_ITEM: SaleItem = {
  productName: '',
  quantity: 1,
  unit: Unit.HOP,
  unitPrice: 0,
  total: 0,
};

const mapSale = (s: any): SaleInvoice => ({
  key: String(s.id),
  id: s.id,
  invoiceCode: s.invoice_code,
  customerName: s.customer_name,
  customerPhone: s.customer_phone,
  saleType: s.sale_type,
  items: (s.items || []).map((item: any) => ({
    productName: item.productName,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    total: Number(item.total),
  })),
  totalAmount: Number(s.total_amount),
  paid: Boolean(s.paid),
  saleDate: s.sale_date,
  createdBy: s.created_by || '',
});

const SalesPage = () => {
  const [filterForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SaleInvoice | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);

  const { data: salesRes, isLoading } = useGetSales(filters);
  const createMutation = useCreateSale();
  const updateMutation = useUpdateSale();
  const deleteMutation = useDeleteSale();
  const { data: productListRes } = useGetProductList();

  const productOptions = (productListRes?.data || []).map((p: any) => ({
    label: p.label,
    value: p.value,
    price: Number(p.price),
  }));

  const dataSource: SaleInvoice[] = (salesRes?.data || []).map(mapSale);
  const loading = isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const totalRevenue = useMemo(() => dataSource.reduce((sum, item) => sum + item.totalAmount, 0), [dataSource]);
  const totalDebt = useMemo(
    () => dataSource.filter(item => !item.paid).reduce((sum, item) => sum + item.totalAmount, 0),
    [dataSource]
  );

  const handleSearch = (values: any) => {
    const params: Record<string, any> = {};
    if (values.keyword) params.keyword = values.keyword;
    if (values.paid !== undefined && values.paid !== null) params.paid = String(values.paid);
    if (values.saleDate) params.saleDate = toApiDate(values.saleDate);
    setFilters(params);
  };

  const handleClearFilter = () => {
    filterForm.resetFields();
    setFilters({});
  };

  const openCreateModal = () => {
    setEditingInvoice(null);
    modalForm.resetFields();
    setSaleItems([{ ...EMPTY_ITEM }]);
    setModalOpen(true);
  };

  const openEditModal = (record: SaleInvoice) => {
    setEditingInvoice(record);
    modalForm.setFieldsValue({
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      saleType: record.saleType,
      paid: record.paid,
      saleDate: dayjs(record.saleDate),
    });
    setSaleItems([...record.items]);
    setModalOpen(true);
  };

  const handleAddItem = () => setSaleItems([...saleItems, { ...EMPTY_ITEM }]);

  const handleRemoveItem = (index: number) => {
    if (saleItems.length <= 1) return;
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof SaleItem, value: any) => {
    const updated = [...saleItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'productName') {
      const product = productOptions.find((p: any) => p.value === value);
      if (product) {
        updated[index].unitPrice = product.price;
        updated[index].total = product.price * updated[index].quantity;
      }
    }
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].total = updated[index].quantity * updated[index].unitPrice;
    }
    setSaleItems(updated);
  };

  const getTotalAmount = () => saleItems.reduce((sum, item) => sum + item.total, 0);

  const handleModalSubmit = () => {
    modalForm.validateFields().then(values => {
      const validItems = saleItems.filter(item => item.productName && item.quantity > 0);
      if (validItems.length === 0) return;

      const payload = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        saleType: values.saleType,
        items: validItems,
        paid: values.paid,
        saleDate: toApiDate(values.saleDate),
        createdBy: values.customerName,
      };

      if (editingInvoice) {
        updateMutation.mutate({ id: editingInvoice.id, data: payload }, {
          onSuccess: () => {
            message.success('Cập nhật hóa đơn thành công');
            setModalOpen(false);
            modalForm.resetFields();
            setSaleItems([]);
          },
          onError: () => message.error('Cập nhật hóa đơn thất bại'),
        });
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => {
            message.success('Thêm hóa đơn thành công');
            setModalOpen(false);
            modalForm.resetFields();
            setSaleItems([]);
          },
          onError: () => message.error('Thêm hóa đơn thất bại'),
        });
      }
    });
  };

  const handleDelete = (record: SaleInvoice) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => message.success('Xóa hóa đơn thành công'),
      onError: () => message.error('Xóa hóa đơn thất bại'),
    });
  };

  const columns = [
    sttColumn,
    {
      title: 'Mã hóa đơn',
      dataIndex: 'invoiceCode',
      key: 'invoiceCode',
      render: (text: string) => <span className="font-bold">{text}</span>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string, record: SaleInvoice) => (
        <div>
          <div className="font-bold">{text}</div>
          <div className="text-xs text-gray-500">{record.customerPhone}</div>
        </div>
      ),
    },
    {
      title: 'Loại bán',
      dataIndex: 'saleType',
      key: 'saleType',
      align: 'center' as const,
      render: (type: string) => {
        const info = saleTypeLabels[type] || { label: type, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Số sản phẩm',
      key: 'itemCount',
      align: 'center' as const,
      render: (_: any, record: SaleInvoice) => record.items.length,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      render: (val: number) => <span className="font-bold">{formatCurrency(val)}</span>,
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paid',
      key: 'paid',
      align: 'center' as const,
      render: (paid: boolean) => (
        <Tag color={paid ? 'success' : 'error'}>{paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</Tag>
      ),
    },
    {
      title: 'Ngày bán',
      dataIndex: 'saleDate',
      key: 'saleDate',
      align: 'center' as const,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center' as const,
      width: 150,
      render: (_: any, record: SaleInvoice) => (
        <ActionColumn
          onEdit={() => openEditModal(record)}
          onDelete={() => handleDelete(record)}
          deleteTitle="Xóa hóa đơn"
          deleteDescription={`Bạn có chắc muốn xóa hóa đơn "${record.invoiceCode}"?`}
        />
      ),
    },
  ];

  return (
    <div className="sales-page">
      <Row gutter={[16, 16]} className="mb-6">
        <StatCard
          title="Tổng thu nhập"
          value={totalRevenue}
          suffix="đ"
          prefix={<FiDollarSign className="text-success mr-2" />}
          bgColor="bg-green-50"
          colSpan={12}
        />
        <StatCard
          title="Dư nợ"
          value={totalDebt}
          suffix="đ"
          prefix={<FiAlertCircle className="mr-2" />}
          bgColor="bg-red-50"
          valueStyle={{ color: '#cf1322' }}
          colSpan={12}
        />
      </Row>

      <FilterSection
        form={filterForm}
        onSearch={handleSearch}
        onClear={handleClearFilter}
        loading={loading}
      >
        <Form.Item name="keyword" label="Tìm kiếm khách hàng" className="flex-1 mb-0">
          <AppInput placeholder="Nhập tên khách hàng..." prefix={<FiSearch />} />
        </Form.Item>
        <Form.Item name="paid" label="Trạng thái thanh toán" className="w-[220px] mb-0">
          <AppSelect allowClear placeholder="Chọn trạng thái" options={paidOptions} />
        </Form.Item>
        <Form.Item name="saleDate" label="Ngày bán hàng" className="w-[200px] mb-0">
          <AppDatePicker placeholder="Chọn ngày" format={DATE_FORMAT.DISPLAY} className="w-full" />
        </Form.Item>
      </FilterSection>

      <TableSection
        totalLabel="Tổng số hóa đơn"
        totalCount={dataSource.length}
        addLabel="Thêm hóa đơn"
        onAdd={openCreateModal}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        scroll={{ x: 1200 }}
      />

      <CrudModal
        open={modalOpen}
        title={editingInvoice ? 'Chỉnh sửa hóa đơn' : 'Thêm hóa đơn mới'}
        onCancel={() => {
          setModalOpen(false);
          modalForm.resetFields();
          setSaleItems([]);
        }}
        onSubmit={handleModalSubmit}
        submitLabel={editingInvoice ? 'Cập nhật' : 'Thêm mới'}
        width={800}
      >
        <Form form={modalForm} layout="vertical" className="pt-4" autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="customerName"
                label="Tên khách hàng"
                rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
              >
                <AppInput placeholder="Nhập tên khách hàng" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="customerPhone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <AppInput placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="saleType"
                label="Loại bán"
                rules={[{ required: true, message: 'Vui lòng chọn loại bán' }]}
              >
                <AppSelect placeholder="Chọn loại bán" options={saleTypeOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="saleDate"
                label="Ngày bán hàng"
                rules={[{ required: true, message: 'Vui lòng chọn ngày bán hàng' }]}
              >
                <AppDatePicker
                  placeholder="Chọn ngày"
                  format={DATE_FORMAT.DISPLAY}
                  className="w-full"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="paid"
                label="Trạng thái thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán' }]}
              >
                <AppSelect placeholder="Chọn trạng thái" options={paidOptions} />
              </Form.Item>
            </Col>
          </Row>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Danh sách sản phẩm</span>
              <AppButton type="primary" size="small" icon={<FiPlus />} onClick={handleAddItem}>
                Thêm sản phẩm
              </AppButton>
            </div>

            {saleItems.map((item, index) => (
              <Row gutter={[12, 0]} key={index} className="mb-2 items-center">
                <Col xs={24} sm={7}>
                  <AppSelect
                    showSearch
                    filterOption={(input, option) =>
                      ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    placeholder="Chọn sản phẩm"
                    options={productOptions}
                    value={item.productName || undefined}
                    onChange={val => handleItemChange(index, 'productName', val)}
                    className="w-full"
                  />
                </Col>
                <Col xs={24} sm={3}>
                  <AppInputNumber
                    placeholder="SL"
                    decimalScale={0}
                    value={item.quantity}
                    onValueChange={val => handleItemChange(index, 'quantity', val.floatValue || 0)}
                    className="w-full"
                  />
                </Col>
                <Col xs={24} sm={3}>
                  <AppSelect
                    placeholder="Đơn vị"
                    options={unitOptions}
                    value={item.unit || undefined}
                    onChange={val => handleItemChange(index, 'unit', val)}
                    className="w-full"
                  />
                </Col>
                <Col xs={24} sm={4}>
                  <AppInputNumber
                    placeholder="Đơn giá"
                    decimalScale={0}
                    value={item.unitPrice}
                    onValueChange={val => handleItemChange(index, 'unitPrice', val.floatValue || 0)}
                    className="w-full"
                    suffix=" đ"
                  />
                </Col>
                <Col xs={24} sm={4}>
                  <AppInput value={formatCurrency(item.total)} disabled className="w-full" />
                </Col>
                <Col xs={24} sm={2}>
                  {saleItems.length > 1 && (
                    <AppButton
                      type="text"
                      color="red"
                      icon={<FiTrash2 />}
                      onClick={() => handleRemoveItem(index)}
                    />
                  )}
                </Col>
              </Row>
            ))}

            <div className="flex justify-end mt-3 text-lg font-bold">
              Tổng cộng: {formatCurrency(getTotalAmount())}
            </div>
          </div>
        </Form>
      </CrudModal>
    </div>
  );
};

export default SalesPage;
