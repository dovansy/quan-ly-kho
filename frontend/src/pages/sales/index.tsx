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
import { saleTypeLabels, paidOptions } from '@/constants/options';
import { DATE_FORMAT } from '@/constants/format';
import { useGetSales, useCreateSale, useUpdateSale, useDeleteSale } from '@/hooks/api/sales';
import { useGetInventory } from '@/hooks/api/inventory';
import { sttColumn } from '@/utils/tableColumns';
import { formatCurrency, formatDate, toApiDate } from '@/utils/format';
import { exportToExcel } from '@/utils/exportExcel';
import { Col, Form, Row, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { SaleType } from '@/constants/enums';
import {
  FiPlus, FiSearch, FiTrash2, FiDollarSign, FiAlertCircle,
  FiShoppingCart, FiPackage, FiUsers, FiDownload,
} from 'react-icons/fi';

interface SaleLine {
  id?: number;
  inventory_id?: number;          // Reference to inventory_balance for picker UX
  product_id: number;
  product_name: string;
  warehouse_id: number;
  warehouse_name: string;
  supplier: string;
  batch: string;
  small_unit_id: number;
  small_unit_label: string;
  available: number;              // Tồn hiện có
  quantity: number;
  unit_price: number;
  total: number;
}

interface SaleOrderRow {
  id: number;
  key: string;
  invoice_code: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  sale_type: string;
  items: SaleLine[];
  total_amount: number;
  paid: boolean;
  sale_date: string;
}

const mapSale = (s: any): SaleOrderRow => ({
  id: s.id,
  key: String(s.id),
  invoice_code: s.invoice_code,
  customer_name: s.customer_name || '',
  customer_phone: s.customer_phone || '',
  customer_address: s.customer_address || '',
  sale_type: s.sale_type,
  items: (s.items || []).map((i: any) => ({
    id: i.id,
    product_id: i.product_id,
    product_name: i.product_name,
    warehouse_id: i.warehouse_id,
    warehouse_name: i.warehouse_name || '',
    supplier: i.supplier,
    batch: i.batch,
    small_unit_id: i.small_unit_id,
    small_unit_label: i.small_unit?.label || '',
    available: 0,
    quantity: Number(i.quantity) || 0,
    unit_price: Number(i.unit_price) || 0,
    total: Number(i.total) || 0,
  })),
  total_amount: Number(s.total_amount),
  paid: Boolean(s.paid),
  sale_date: s.sale_date,
});

const SalesPage = () => {
  const [filterForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [filters, setFilters] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SaleOrderRow | null>(null);
  const [lines, setLines] = useState<SaleLine[]>([]);

  const { data: salesRes, isLoading } = useGetSales(filters);
  const create = useCreateSale();
  const update = useUpdateSale();
  const remove = useDeleteSale();
  const { data: inventoryRes } = useGetInventory();
  const currentSaleType = Form.useWatch('saleType', modalForm);

  const inventoryOptions = useMemo(() => {
    return (inventoryRes?.data || []).map((it: any) => ({
      label: `${it.product_name} — ${it.warehouse_name} | NCC: ${it.supplier} | Lô: ${it.batch} (Tồn: ${it.stock_pieces} ${it.small_unit?.label || ''})`,
      value: it.id,
      record: it,
    }));
  }, [inventoryRes?.data]);

  const data = (salesRes?.data || []).map(mapSale);
  const loading = isLoading || create.isPending || update.isPending || remove.isPending;

  const totalRevenue = useMemo(
    () => data.reduce((s, x) => s + x.total_amount, 0), [data]);
  const totalDebt = useMemo(
    () => data.filter(x => !x.paid).reduce((s, x) => s + x.total_amount, 0), [data]);

  const onSearch = (v: any) => setFilters({
    keyword: v.keyword,
    paid: v.paid !== undefined && v.paid !== null ? String(v.paid) : undefined,
    saleDate: v.saleDate ? toApiDate(v.saleDate) : undefined,
  });

  const onClear = () => { filterForm.resetFields(); setFilters({}); };

  const openCreate = (saleType?: string) => {
    setEditing(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({
      saleDate: dayjs(),
      saleType: saleType || SaleType.RETAIL,
      paid: false,
    });
    setLines([]);
    setModalOpen(true);
  };

  const openEdit = (r: SaleOrderRow) => {
    setEditing(r);
    modalForm.setFieldsValue({
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerAddress: r.customer_address,
      saleType: r.sale_type,
      paid: r.paid,
      saleDate: r.sale_date ? dayjs(r.sale_date) : undefined,
    });
    // Re-attach available from current inventory
    const enriched = r.items.map(it => {
      const inv = (inventoryRes?.data || []).find((x: any) =>
        x.product_id === it.product_id && x.warehouse_id === it.warehouse_id
        && x.supplier === it.supplier && x.batch === it.batch);
      return {
        ...it,
        inventory_id: inv?.id,
        available: inv?.stock_pieces || 0,
      };
    });
    setLines(enriched);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); modalForm.resetFields(); setLines([]); };

  const addLine = () => setLines(prev => [...prev, {
    product_id: 0, product_name: '', warehouse_id: 0, warehouse_name: '',
    supplier: '', batch: '', small_unit_id: 0, small_unit_label: '',
    available: 0, quantity: 0, unit_price: 0, total: 0,
  }]);

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const updateLine = (idx: number, patch: Partial<SaleLine>) => {
    setLines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      next[idx].total = next[idx].quantity * next[idx].unit_price;
      return next;
    });
  };

  const onPickInventory = (idx: number, inventoryId: number) => {
    const opt = inventoryOptions.find(o => o.value === inventoryId);
    if (!opt) return;
    const r = opt.record;
    updateLine(idx, {
      inventory_id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      warehouse_id: r.warehouse_id,
      warehouse_name: r.warehouse_name,
      supplier: r.supplier,
      batch: r.batch,
      small_unit_id: r.small_unit?.id || 0,
      small_unit_label: r.small_unit?.label || '',
      available: r.stock_pieces,
      unit_price: 0,
      quantity: 0,
      total: 0,
    });
  };

  const onSubmit = () => {
    modalForm.validateFields().then(values => {
      if (lines.length === 0) { message.warning('Phải có ít nhất 1 dòng'); return; }
      for (const l of lines) {
        if (!l.product_id) { message.warning('Chọn SP cho mọi dòng'); return; }
        if (l.quantity <= 0) { message.warning(`Số lượng SP "${l.product_name}" phải > 0`); return; }
        if (l.quantity > l.available) {
          message.warning(`Tồn không đủ cho "${l.product_name}" (lô ${l.batch}): còn ${l.available}, cần ${l.quantity}`);
          return;
        }
      }

      const payload = {
        customerName: values.customerName,
        customerPhone: values.customerPhone || '',
        customerAddress: values.customerAddress || '',
        saleType: values.saleType,
        paid: !!values.paid,
        saleDate: toApiDate(values.saleDate),
        items: lines.map(l => ({
          product_id: l.product_id,
          product_name: l.product_name,
          warehouse_id: l.warehouse_id,
          supplier: l.supplier,
          batch: l.batch,
          small_unit_id: l.small_unit_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
          total: l.quantity * l.unit_price,
        })),
      };

      if (editing) {
        update.mutate({ id: editing.id, data: payload }, {
          onSuccess: () => { message.success('Cập nhật hóa đơn thành công'); closeModal(); },
          onError: (e: any) => message.error(e?.response?.data?.message || 'Lỗi cập nhật'),
        });
      } else {
        create.mutate(payload, {
          onSuccess: () => { message.success('Tạo hóa đơn thành công'); closeModal(); },
          onError: (e: any) => message.error(e?.response?.data?.message || 'Lỗi tạo hóa đơn'),
        });
      }
    });
  };

  const onDelete = (r: SaleOrderRow) => {
    remove.mutate(r.id, {
      onSuccess: () => message.success('Xóa hóa đơn thành công'),
      onError: () => message.error('Không thể xóa hóa đơn'),
    });
  };

  const handleExportExcel = () => {
    const flat = data.flatMap(s => {
      const saleTypeLabel = saleTypeLabels[s.sale_type]?.label || s.sale_type;
      const items = s.items.length ? s.items : [null];
      return items.map((l: any) => ({
        invoice_code: s.invoice_code,
        customer_name: s.customer_name,
        customer_phone: s.customer_phone,
        customer_address: s.customer_address,
        sale_type: saleTypeLabel,
        paid: s.paid ? 'Đã trả' : 'Còn nợ',
        sale_date: s.sale_date,
        total_amount: s.total_amount,
        product_name: l?.product_name || '',
        warehouse_name: l?.warehouse_name || '',
        supplier: l?.supplier || '',
        batch: l?.batch || '',
        small_unit_label: l?.small_unit_label || '',
        quantity: l?.quantity ?? '',
        unit_price: l?.unit_price ?? '',
        line_total: l?.total ?? '',
      }));
    });

    exportToExcel(
      [
        { title: 'STT', dataIndex: 'index' },
        { title: 'Mã HĐ', dataIndex: 'invoice_code' },
        { title: 'Khách hàng', dataIndex: 'customer_name' },
        { title: 'SĐT', dataIndex: 'customer_phone' },
        { title: 'Địa chỉ', dataIndex: 'customer_address' },
        { title: 'Loại bán', dataIndex: 'sale_type' },
        { title: 'Thanh toán', dataIndex: 'paid' },
        { title: 'Ngày bán', dataIndex: 'sale_date', render: (v: string) => v ? formatDate(v) : '' },
        { title: 'Tên SP', dataIndex: 'product_name' },
        { title: 'Kho', dataIndex: 'warehouse_name' },
        { title: 'NCC', dataIndex: 'supplier' },
        { title: 'Lô', dataIndex: 'batch' },
        { title: 'Đơn vị', dataIndex: 'small_unit_label' },
        { title: 'Số lượng', dataIndex: 'quantity' },
        { title: 'Đơn giá', dataIndex: 'unit_price' },
        { title: 'Thành tiền dòng', dataIndex: 'line_total' },
        { title: 'Tổng HĐ', dataIndex: 'total_amount' },
      ],
      flat,
      `Ban_hang_${dayjs().format('YYYYMMDD_HHmmss')}`,
      'Ban hang',
    );
  };

  const columns = [
    sttColumn,
    { title: 'Mã HĐ', dataIndex: 'invoice_code', key: 'invoice_code',
      render: (t: string) => <span className="font-bold">{t}</span> },
    { title: 'Khách hàng', dataIndex: 'customer_name', key: 'customer_name' },
    { title: 'SĐT', dataIndex: 'customer_phone', key: 'customer_phone' },
    { title: 'Loại', dataIndex: 'sale_type', key: 'sale_type', align: 'center' as const,
      render: (s: string) => {
        const i = saleTypeLabels[s] || { label: s, color: 'default' };
        return <Tag color={i.color}>{i.label}</Tag>;
      } },
    { title: 'Số dòng', key: 'line_count', align: 'center' as const,
      render: (_: any, r: SaleOrderRow) => r.items.length },
    { title: 'Tổng tiền', dataIndex: 'total_amount', key: 'total_amount', align: 'right' as const,
      render: (v: number) => formatCurrency(v) },
    { title: 'Thanh toán', dataIndex: 'paid', key: 'paid', align: 'center' as const,
      render: (v: boolean) => v ? <Tag color="success">Đã trả</Tag> : <Tag color="error">Còn nợ</Tag> },
    { title: 'Ngày bán', dataIndex: 'sale_date', key: 'sale_date', align: 'center' as const,
      render: (d: string) => formatDate(d) },
    {
      title: 'Hành động', key: 'actions', align: 'center' as const, width: 150,
      render: (_: any, r: SaleOrderRow) => (
        <ActionColumn onEdit={() => openEdit(r)} onDelete={() => onDelete(r)}
          deleteTitle="Xóa hóa đơn" deleteDescription={`Xóa hóa đơn "${r.invoice_code}"?`} />
      ),
    },
  ];

  return (
    <div className="sales-page">
      <Row gutter={[16, 16]} className="mb-6">
        <StatCard title="Tổng doanh thu" value={totalRevenue} suffix="đ"
          prefix={<FiDollarSign className="mr-2" />} bgColor="bg-green-50" colSpan={12} />
        <StatCard title="Dư nợ" value={totalDebt} suffix="đ"
          prefix={<FiAlertCircle className="mr-2" />} bgColor="bg-red-50"
          valueStyle={{ color: '#cf1322' }} colSpan={12} />
      </Row>

      <FilterSection form={filterForm} onSearch={onSearch} onClear={onClear} loading={loading}>
        <Form.Item name="keyword" label="Tìm khách hàng" className="flex-1 mb-0">
          <AppInput placeholder="Tên KH hoặc mã HĐ..." prefix={<FiSearch />} />
        </Form.Item>
        <Form.Item name="paid" label="Thanh toán" className="w-[200px] mb-0">
          <AppSelect allowClear placeholder="Chọn trạng thái" options={paidOptions} />
        </Form.Item>
        <Form.Item name="saleDate" label="Ngày bán" className="w-[180px] mb-0">
          <AppDatePicker placeholder="Chọn ngày" format={DATE_FORMAT.DISPLAY} className="w-full" />
        </Form.Item>
      </FilterSection>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <AppButton type="primary" icon={<FiPackage />} size="large" className="w-full"
            style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
            onClick={() => openCreate(SaleType.WHOLESALE)}>
            Bán buôn
          </AppButton>
        </Col>
        <Col xs={24} sm={8}>
          <AppButton type="primary" icon={<FiShoppingCart />} size="large" className="w-full"
            style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
            onClick={() => openCreate(SaleType.RETAIL)}>
            Bán lẻ
          </AppButton>
        </Col>
        <Col xs={24} sm={8}>
          <AppButton type="primary" icon={<FiUsers />} size="large" className="w-full"
            style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
            onClick={() => openCreate(SaleType.BROKER)}>
            Bán cho NCC trung gian
          </AppButton>
        </Col>
      </Row>

      <TableSection
        totalLabel="Tổng số hóa đơn"
        totalCount={data.length}
        extraActions={
          <AppButton icon={<FiDownload />} type="default" onClick={handleExportExcel}>
            Xuất Excel
          </AppButton>
        }
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1200 }}
      />

      <CrudModal
        open={modalOpen}
        title={
          editing
            ? `Chỉnh sửa: ${editing.invoice_code}`
            : `Tạo hóa đơn xuất hàng (${saleTypeLabels[currentSaleType || '']?.label || ''})`
        }
        onCancel={closeModal}
        onSubmit={onSubmit}
        submitLabel={editing ? 'Cập nhật' : 'Tạo hóa đơn'}
        loading={create.isPending || update.isPending}
        width={1100}
      >
        <Form form={modalForm} layout="vertical" className="pt-4" autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="customerName" label="Tên khách hàng"
                rules={[{ required: true }]}>
                <AppInput placeholder="Tên KH" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="customerPhone" label="SĐT">
                <AppInput placeholder="SĐT" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="saleDate" label="Ngày bán"
                rules={[{ required: true }]}>
                <AppDatePicker format={DATE_FORMAT.DISPLAY} className="w-full" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={16}>
              <Form.Item name="customerAddress" label="Địa chỉ">
                <AppInput placeholder="Địa chỉ" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="paid" label="Thanh toán" rules={[{ required: true }]}>
                <AppSelect options={paidOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="saleType" hidden><AppInput /></Form.Item>

          <div className="flex items-center justify-between pt-2 mt-2 mb-2 border-t">
            <h4 className="m-0 text-base font-semibold">Danh sách dòng bán</h4>
            <AppButton icon={<FiPlus />} onClick={addLine} type="default">Thêm dòng</AppButton>
          </div>
          {lines.length === 0 && (
            <p className="text-sm text-center text-gray-400 py-4">Chưa có dòng nào — bấm "Thêm dòng" để chọn từ kho.</p>
          )}
          {lines.map((line, idx) => (
            <Row gutter={[8, 0]} key={idx} className="items-end pb-2 mb-2 border-b">
              <Col xs={24} md={10}>
                <Form.Item label={idx === 0 ? 'Chọn từ tồn kho' : ''} className="mb-1">
                  <AppSelect
                    showSearch
                    placeholder="Chọn dòng tồn"
                    value={line.inventory_id}
                    options={inventoryOptions}
                    filterOption={(i, o) => (o?.label as string ?? '').toLowerCase().includes(i.toLowerCase())}
                    onChange={(v) => onPickInventory(idx, v)}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={3}>
                <Form.Item label={idx === 0 ? `SL (max ${line.available})` : ''} className="mb-1">
                  <AppInputNumber decimalScale={0} value={line.quantity} className="w-full"
                    onValueChange={v => updateLine(idx, { quantity: v.floatValue || 0 })} />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item label={idx === 0 ? 'Đơn giá' : ''} className="mb-1">
                  <AppInputNumber decimalScale={0} value={line.unit_price} className="w-full"
                    onValueChange={v => updateLine(idx, { unit_price: v.floatValue || 0 })} />
                </Form.Item>
              </Col>
              <Col xs={20} md={5}>
                <Form.Item label={idx === 0 ? 'Thành tiền' : ''} className="mb-1">
                  <div className="font-semibold">{formatCurrency(line.total)}</div>
                </Form.Item>
              </Col>
              <Col xs={4} md={2}>
                <Form.Item label={idx === 0 ? ' ' : ''} className="mb-1">
                  <AppButton danger icon={<FiTrash2 />} onClick={() => removeLine(idx)} />
                </Form.Item>
              </Col>
            </Row>
          ))}
          {lines.length > 0 && (
            <div className="text-right text-lg font-bold">
              Tổng: <span className="text-primary">{formatCurrency(lines.reduce((s, l) => s + l.total, 0))}</span>
            </div>
          )}
        </Form>
      </CrudModal>
    </div>
  );
};

export default SalesPage;
