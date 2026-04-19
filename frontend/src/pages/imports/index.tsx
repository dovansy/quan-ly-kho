import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppInput } from '@/components/atoms/AppInput';
import { AppInputNumber } from '@/components/atoms/AppInput/InputNumber';
import { AppSelect } from '@/components/atoms/AppSelect';
import { ActionColumn } from '@/components/molecules/action-column';
import { CrudModal } from '@/components/organisms/crud-modal';
import { FilterSection } from '@/components/organisms/filter-section';
import { TableSection } from '@/components/organisms/table-section';
import { DATE_FORMAT } from '@/constants/format';
import { useGetImports, useCreateImport, useUpdateImport, useDeleteImport } from '@/hooks/api/imports';
import { useGetSmallUnitOptions } from '@/hooks/api/small-units';
import { useGetWarehouseList } from '@/hooks/api/warehouses';
import { useGetProducts, useGetProductCategories } from '@/hooks/api/products';
import { sttColumn } from '@/utils/tableColumns';
import { formatDate, formatNumber } from '@/utils/format';
import { exportToExcel } from '@/utils/exportExcel';
import { AppButton } from '@/components/atoms/AppButton';
import { Col, Form, Row, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { FiDownload, FiSearch } from 'react-icons/fi';

interface ImportRecord {
  id: number;
  product_id: number;
  product_name: string;
  category: string | null;
  warehouse_id: number;
  warehouse_name: string;
  supplier: string;
  batch: string;
  small_unit_id: number;
  small_unit: { id: number; code: string; label: string } | null;
  carton_quantity: number;
  units_per_carton: number;
  piece_quantity: number;
  total_pieces: number;
  expiry_date: string;
  imported_by: string | null;
  import_date: string;
}

const ImportsPage = () => {
  const [filterForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [filters, setFilters] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ImportRecord | null>(null);

  const { data: importsRes, isLoading } = useGetImports(filters);
  const { data: warehouseListRes } = useGetWarehouseList();
  const { data: smallUnitsRes } = useGetSmallUnitOptions();
  const { data: catRes } = useGetProductCategories();
  const { data: productsRes } = useGetProducts({ limit: 1000 });
  const { data: allImportsRes } = useGetImports({ limit: 1000 } as any);

  const create = useCreateImport();
  const update = useUpdateImport();
  const remove = useDeleteImport();

  const data: ImportRecord[] = (importsRes?.data || []) as any;
  const warehouseOptions = (warehouseListRes?.data || []).map((w: any) => ({ label: w.label, value: w.id }));
  const smallUnitOpts = smallUnitsRes?.data || [];
  const categoryOpts = catRes?.data || [];
  const productList: any[] = productsRes?.data || [];
  const productNameOpts = productList.map((p: any) => ({ label: p.name, value: p.name }));
  const allImports: ImportRecord[] = (allImportsRes?.data || []) as any;

  const loading = isLoading || create.isPending || update.isPending || remove.isPending;

  const onSearch = (values: any) => {
    setFilters({
      keyword: values.keyword,
      warehouse_id: values.warehouse_id,
      supplier: values.supplier,
      batch: values.batch,
      importDate: values.importDate ? dayjs(values.importDate).format('YYYY-MM-DD') : undefined,
    });
  };

  const onClear = () => { filterForm.resetFields(); setFilters({}); };

  const openCreate = () => {
    setEditing(null);
    modalForm.resetFields();
    const defaultUnit = smallUnitOpts.find((u: any) => u.code === 'hop');
    modalForm.setFieldsValue({
      import_date: dayjs(),
      carton_quantity: 0,
      units_per_carton: 1,
      piece_quantity: 0,
      small_unit_id: defaultUnit?.value,
    });
    setModalOpen(true);
  };

  const openEdit = (r: ImportRecord) => {
    setEditing(r);
    modalForm.setFieldsValue({
      product_name: r.product_name,
      category: r.category,
      warehouse_id: r.warehouse_id,
      supplier: r.supplier,
      batch: r.batch,
      small_unit_id: r.small_unit_id,
      carton_quantity: r.carton_quantity,
      units_per_carton: r.units_per_carton,
      piece_quantity: r.piece_quantity,
      expiry_date: r.expiry_date ? dayjs(r.expiry_date) : undefined,
      import_date: r.import_date ? dayjs(r.import_date) : undefined,
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); modalForm.resetFields(); };

  const onSubmit = () => {
    modalForm.validateFields().then(values => {
      const payload = {
        product_name: values.product_name,
        category: values.category,
        warehouse_id: Number(values.warehouse_id),
        supplier: values.supplier,
        batch: values.batch,
        small_unit_id: Number(values.small_unit_id),
        carton_quantity: Number(values.carton_quantity || 0),
        units_per_carton: Number(values.units_per_carton || 1),
        piece_quantity: Number(values.piece_quantity || 0),
        expiry_date: dayjs(values.expiry_date).format('YYYY-MM-DD'),
        import_date: dayjs(values.import_date).format('YYYY-MM-DD'),
      };

      const total = payload.carton_quantity * payload.units_per_carton + payload.piece_quantity;
      if (total <= 0) { message.warning('Số lượng nhập phải > 0'); return; }

      if (editing) {
        update.mutate({ id: editing.id, data: payload }, {
          onSuccess: () => { message.success('Cập nhật bản ghi nhập thành công'); closeModal(); },
          onError: (e: any) => message.error(e?.response?.data?.message || 'Không thể cập nhật'),
        });
      } else {
        create.mutate(payload, {
          onSuccess: () => { message.success('Nhập hàng thành công'); closeModal(); },
          onError: (e: any) => message.error(e?.response?.data?.message || 'Không thể nhập hàng'),
        });
      }
    });
  };

  const onDelete = (r: ImportRecord) => {
    remove.mutate(r.id, {
      onSuccess: () => message.success('Xóa bản ghi nhập thành công'),
      onError: (e: any) => message.error(e?.response?.data?.message || 'Không thể xóa'),
    });
  };

  const handleExportExcel = () => {
    exportToExcel(
      [
        { title: 'STT', dataIndex: 'index' },
        { title: 'Tên SP', dataIndex: 'product_name' },
        { title: 'Loại', dataIndex: 'category' },
        { title: 'Kho', dataIndex: 'warehouse_name' },
        { title: 'NCC', dataIndex: 'supplier' },
        { title: 'Lô', dataIndex: 'batch' },
        { title: 'Đơn vị lẻ', dataIndex: 'small_unit', render: (u: any) => u?.label || '' },
        { title: 'Số kiện', dataIndex: 'carton_quantity' },
        { title: 'Lẻ/Kiện', dataIndex: 'units_per_carton' },
        { title: 'Số lẻ (ngoài kiện)', dataIndex: 'piece_quantity' },
        { title: 'Tổng (lẻ)', dataIndex: 'total_pieces' },
        { title: 'HSD', dataIndex: 'expiry_date', render: (v: string) => v ? formatDate(v) : '' },
        { title: 'Ngày nhập', dataIndex: 'import_date', render: (v: string) => v ? formatDate(v) : '' },
        { title: 'Người nhập', dataIndex: 'imported_by' },
      ],
      data,
      `Nhap_hang_${dayjs().format('YYYYMMDD_HHmmss')}`,
      'Nhap hang',
    );
  };

  const cartonQty = Number(Form.useWatch('carton_quantity', modalForm)) || 0;
  const unitsPer = Number(Form.useWatch('units_per_carton', modalForm)) || 0;
  const pieceQty = Number(Form.useWatch('piece_quantity', modalForm)) || 0;
  const smallUnitId = Form.useWatch('small_unit_id', modalForm);
  const productNameWatch = Form.useWatch('product_name', modalForm);
  const warehouseIdWatch = Form.useWatch('warehouse_id', modalForm);

  const matchedProduct = useMemo(
    () => productList.find((p: any) => p.name === productNameWatch) || null,
    [productList, productNameWatch],
  );
  const isExistingProduct = !!matchedProduct;

  const productImports = useMemo(
    () => matchedProduct ? allImports.filter(i => i.product_id === matchedProduct.id) : [],
    [allImports, matchedProduct],
  );

  const filteredWarehouseOptions = useMemo(() => {
    if (!isExistingProduct) return warehouseOptions;
    const ids = new Set(productImports.map(i => i.warehouse_id));
    const filtered = warehouseOptions.filter(o => ids.has(o.value));
    return filtered.length ? filtered : warehouseOptions;
  }, [isExistingProduct, warehouseOptions, productImports]);

  const batchOptions = useMemo(() => {
    if (!isExistingProduct || !warehouseIdWatch) return [];
    const batches = Array.from(new Set(
      productImports.filter(i => i.warehouse_id === Number(warehouseIdWatch)).map(i => i.batch)
    ));
    return batches.map(b => ({ label: b, value: b }));
  }, [isExistingProduct, warehouseIdWatch, productImports]);

  const onProductNameSelect = (value: string) => {
    if (editing) return;
    const prod = productList.find((p: any) => p.name === value);
    if (!prod) return;

    const prodImports = allImports.filter(i => i.product_id === prod.id);
    const uniqueWids = Array.from(new Set(prodImports.map(i => i.warehouse_id)));
    const currentWid = modalForm.getFieldValue('warehouse_id');
    const nextWid = uniqueWids.length === 1
      ? uniqueWids[0]
      : (uniqueWids.includes(Number(currentWid)) ? currentWid : undefined);

    modalForm.setFieldsValue({
      category: prod.category ?? undefined,
      supplier: prod.supplier ?? undefined,
      small_unit_id: prod.default_small_unit_id,
      warehouse_id: nextWid,
      batch: undefined,
    });
  };

  const onProductNameChange = (value: string) => {
    if (editing) return;
    const prod = productList.find((p: any) => p.name === value);
    if (!prod) {
      modalForm.setFieldsValue({ batch: undefined });
    }
  };

  const onWarehouseChange = () => {
    if (editing) return;
    modalForm.setFieldsValue({ batch: undefined });
  };
  const smallUnitLabel = smallUnitOpts.find((s: any) => s.value === smallUnitId)?.label || '';
  const totalPieces = cartonQty * unitsPer + pieceQty;

  const columns = [
    sttColumn,
    { title: 'Tên SP', dataIndex: 'product_name', key: 'product_name',
      render: (t: string) => <span className="font-bold">{t}</span> },
    { title: 'Loại', dataIndex: 'category', key: 'category',
      render: (t: string) => t ? <Tag color="blue">{t}</Tag> : '-' },
    { title: 'Kho', dataIndex: 'warehouse_name', key: 'warehouse_name' },
    { title: 'NCC', dataIndex: 'supplier', key: 'supplier' },
    { title: 'Lô', dataIndex: 'batch', key: 'batch',
      render: (t: string) => <Tag color="geekblue">{t}</Tag> },
    {
      title: 'Số lượng', key: 'qty', align: 'right' as const,
      render: (_: any, r: ImportRecord) => {
        const u = r.small_unit?.label || '';
        const parts: string[] = [];
        if (r.carton_quantity > 0) parts.push(`${formatNumber(r.carton_quantity)} Kiện × ${r.units_per_carton}`);
        if (r.piece_quantity > 0) parts.push(`${formatNumber(r.piece_quantity)} ${u}`);
        return <span>{parts.join(' + ') || '-'} <span className="text-gray-400">= {formatNumber(r.total_pieces)} {u}</span></span>;
      },
    },
    {
      title: 'HSD', dataIndex: 'expiry_date', key: 'expiry_date', align: 'center' as const,
      render: (d: string) => d ? <Tag>{formatDate(d)}</Tag> : '-',
    },
    { title: 'Ngày nhập', dataIndex: 'import_date', key: 'import_date', align: 'center' as const,
      render: (d: string) => d ? formatDate(d) : '-' },
    { title: 'Người nhập', dataIndex: 'imported_by', key: 'imported_by' },
    {
      title: 'Hành động', key: 'actions', align: 'center' as const, width: 150,
      render: (_: any, r: ImportRecord) => (
        <ActionColumn onEdit={() => openEdit(r)} onDelete={() => onDelete(r)}
          deleteTitle="Xóa bản ghi nhập"
          deleteDescription={`Xóa lần nhập SP "${r.product_name}" lô "${r.batch}"?`} />
      ),
    },
  ];

  return (
    <div className="imports-page">
      <FilterSection form={filterForm} onSearch={onSearch} onClear={onClear} loading={loading}>
        <Form.Item name="keyword" label="Tìm SP" className="flex-1 mb-0">
          <AppInput placeholder="Tên sản phẩm..." prefix={<FiSearch />} />
        </Form.Item>
        <Form.Item name="warehouse_id" label="Kho" className="w-[200px] mb-0">
          <AppSelect allowClear showSearch placeholder="Chọn kho" options={warehouseOptions}
            filterOption={(i, o) => (o?.label ?? '').toString().toLowerCase().includes(i.toLowerCase())} />
        </Form.Item>
        <Form.Item name="batch" label="Lô" className="w-[180px] mb-0">
          <AppInput placeholder="Mã lô" />
        </Form.Item>
        <Form.Item name="importDate" label="Ngày nhập" className="w-[180px] mb-0">
          <AppDatePicker allowClear placeholder="Chọn ngày" format={DATE_FORMAT.DISPLAY} className="w-full" />
        </Form.Item>
      </FilterSection>

      <TableSection
        totalLabel="Tổng số lần nhập"
        totalCount={data.length}
        addLabel="Nhập hàng mới"
        onAdd={openCreate}
        extraActions={
          <AppButton icon={<FiDownload />} type="default" onClick={handleExportExcel}>
            Xuất Excel
          </AppButton>
        }
        columns={columns}
        dataSource={data.map(d => ({ ...d, key: String(d.id) }))}
        loading={loading}
        scroll={{ x: 1400 }}
      />

      <CrudModal
        open={modalOpen}
        title={editing ? 'Chỉnh sửa lần nhập' : 'Nhập hàng mới'}
        onCancel={closeModal}
        onSubmit={onSubmit}
        submitLabel={editing ? 'Cập nhật' : 'Nhập hàng'}
        loading={create.isPending || update.isPending}
        width={760}
      >
        <Form form={modalForm} layout="vertical" className="pt-4" autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item name="product_name" label="Tên sản phẩm"
                rules={[{ required: true, message: 'Vui lòng nhập tên SP' }]}>
                <AppAutoComplete
                  placeholder="Nhập SP mới hoặc chọn SP đã có"
                  options={productNameOpts}
                  onSelect={onProductNameSelect}
                  onChange={onProductNameChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="category" label="Loại sản phẩm">
                <AppAutoComplete placeholder="Nhập hoặc chọn loại" options={categoryOpts} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item name="warehouse_id" label="Kho"
                rules={[{ required: true, message: 'Chọn kho' }]}>
                <AppSelect
                  placeholder="Chọn kho"
                  options={editing ? warehouseOptions : filteredWarehouseOptions}
                  showSearch
                  onChange={onWarehouseChange}
                  filterOption={(i, o) => (o?.label as string ?? '').toLowerCase().includes(i.toLowerCase())}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="supplier" label="Nhà cung cấp"
                rules={[{ required: true, message: 'Nhập NCC' }]}>
                <AppInput placeholder="Tên NCC" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item name="batch" label="Lô"
                rules={[{ required: true, message: 'Nhập mã lô' }]}>
                <AppAutoComplete
                  placeholder={batchOptions.length ? 'Chọn lô đã có hoặc nhập lô mới' : 'Mã lô'}
                  options={batchOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="small_unit_id" label="Đơn vị lẻ"
                rules={[{ required: true, message: 'Chọn đơn vị lẻ' }]}>
                <AppSelect placeholder="Chọn đơn vị" options={smallUnitOpts} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item name="expiry_date" label="HSD"
                rules={[{ required: true, message: 'Chọn HSD' }]}>
                <AppDatePicker placeholder="Chọn HSD" format={DATE_FORMAT.DISPLAY} className="w-full"
                  disabledDate={(c) => c && c.isBefore(dayjs(), 'day')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="import_date" label="Ngày nhập"
                rules={[{ required: true, message: 'Chọn ngày nhập' }]}>
                <AppDatePicker placeholder="Chọn ngày" format={DATE_FORMAT.DISPLAY} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <div className="pb-2 mt-2 mb-2 text-base font-semibold">
            {totalPieces > 0
              ? (() => {
                  const parts: string[] = [];
                  if (cartonQty > 0) parts.push(`${formatNumber(cartonQty)} kiện`);
                  if (pieceQty > 0) parts.push(`${formatNumber(pieceQty)} ${(smallUnitLabel || 'lẻ').toLowerCase()}`);
                  return `Số lượng nhập (${parts.join(', ')} = tổng ${formatNumber(totalPieces)} ${smallUnitLabel})`;
                })()
              : 'Số lượng nhập'}
          </div>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="carton_quantity" label="Số kiện">
                <AppInputNumber placeholder="0" decimalScale={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="units_per_carton" label={`${smallUnitLabel || 'Lẻ'} / Kiện`}
                rules={[{ required: true, message: 'Nhập số lẻ / kiện' }]}>
                <AppInputNumber placeholder="1" decimalScale={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="piece_quantity" label={`Số ${smallUnitLabel || 'lẻ'} (ngoài kiện)`}>
                <AppInputNumber placeholder="0" decimalScale={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </CrudModal>
    </div>
  );
};

export default ImportsPage;
