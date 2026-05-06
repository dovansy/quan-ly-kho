import { Col, Form, Row } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';
import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppInput } from '@/components/atoms/AppInput';
import { AppInputNumber } from '@/components/atoms/AppInput/InputNumber';
import { AppSelect } from '@/components/atoms/AppSelect';
import { CrudModal } from '@/components/organisms/crud-modal';
import { useAppNotification } from '@/components/templates/notification';
import { DATE_FORMAT } from '@/constants/format';
import { useCreateImport, useUpdateImport } from '@/hooks/api/imports';
import { formatNumber } from '@/utils/format';
import { ImportRecord } from '../types';

interface Props {
  open: boolean;
  editing: ImportRecord | null;
  warehouseOptions: { label: string; value: number }[];
  smallUnitOpts: { label: string; value: number; code?: string }[];
  categoryOpts: { label: string; value: string }[];
  productList: any[];
  productNameOpts: { label: string; value: string }[];
  allImports: ImportRecord[];
  onClose: () => void;
}

export const ImportFormModal = ({
  open,
  editing,
  warehouseOptions,
  smallUnitOpts,
  categoryOpts,
  productList,
  productNameOpts,
  allImports,
  onClose,
}: Props) => {
  const [form] = Form.useForm();
  const create = useCreateImport();
  const update = useUpdateImport();
  const { success, error, warning } = useAppNotification();

  const cartonQty = Number(Form.useWatch('carton_quantity', form)) || 0;
  const unitsPer = Number(Form.useWatch('units_per_carton', form)) || 0;
  const pieceQty = Number(Form.useWatch('piece_quantity', form)) || 0;
  const smallUnitId = Form.useWatch('small_unit_id', form);
  const productNameWatch = Form.useWatch('product_name', form);
  const warehouseIdWatch = Form.useWatch('warehouse_id', form);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        product_name: editing.product_name,
        category: editing.category,
        warehouse_id: editing.warehouse_id,
        supplier: editing.supplier,
        batch: editing.batch,
        small_unit_id: editing.small_unit_id,
        carton_quantity: editing.carton_quantity,
        units_per_carton: editing.units_per_carton,
        piece_quantity: editing.piece_quantity,
        expiry_date: editing.expiry_date ? dayjs(editing.expiry_date) : undefined,
        import_date: editing.import_date ? dayjs(editing.import_date) : undefined,
      });
    } else {
      form.resetFields();
      const defaultUnit = smallUnitOpts.find((u: any) => u.code === 'hop');
      form.setFieldsValue({
        import_date: dayjs(),
        small_unit_id: defaultUnit?.value,
      });
    }
  }, [open, editing, smallUnitOpts, form]);

  const matchedProduct = useMemo(
    () => productList.find((p: any) => p.name === productNameWatch) || null,
    [productList, productNameWatch]
  );
  const isExistingProduct = !!matchedProduct;

  const productImports = useMemo(
    () => (matchedProduct ? allImports.filter(i => i.product_id === matchedProduct.id) : []),
    [allImports, matchedProduct]
  );

  const filteredWarehouseOptions = useMemo(() => {
    if (!isExistingProduct) return warehouseOptions;
    const ids = new Set(productImports.map(i => i.warehouse_id));
    const filtered = warehouseOptions.filter(o => ids.has(o.value));
    return filtered.length ? filtered : warehouseOptions;
  }, [isExistingProduct, warehouseOptions, productImports]);

  const batchOptions = useMemo(() => {
    if (!isExistingProduct || !warehouseIdWatch) return [];
    const batches = Array.from(
      new Set(
        productImports.filter(i => i.warehouse_id === Number(warehouseIdWatch)).map(i => i.batch)
      )
    );
    return batches.map(b => ({ label: b, value: b }));
  }, [isExistingProduct, warehouseIdWatch, productImports]);

  const supplierOpts = useMemo(() => {
    const set = new Set<string>();
    productList.forEach((p: any) => p.supplier && set.add(p.supplier));
    allImports.forEach(i => i.supplier && set.add(i.supplier));
    return Array.from(set).map(s => ({ label: s, value: s }));
  }, [productList, allImports]);

  const onProductNameSelect = (value: string) => {
    if (editing) return;
    const prod = productList.find((p: any) => p.name === value);
    if (!prod) return;

    const prodImports = allImports.filter(i => i.product_id === prod.id);
    const uniqueWids = Array.from(new Set(prodImports.map(i => i.warehouse_id)));
    const currentWid = form.getFieldValue('warehouse_id');
    const nextWid =
      uniqueWids.length === 1
        ? uniqueWids[0]
        : uniqueWids.includes(Number(currentWid))
          ? currentWid
          : undefined;

    form.setFieldsValue({
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
      form.setFieldsValue({ batch: undefined });
    }
  };

  const onWarehouseChange = () => {
    if (editing) return;
    form.setFieldsValue({ batch: undefined });
  };

  const smallUnitLabel = smallUnitOpts.find((s: any) => s.value === smallUnitId)?.label || '';
  const totalPieces = cartonQty * unitsPer + pieceQty;

  const close = () => {
    form.resetFields();
    onClose();
  };

  const onSubmit = () => {
    form.validateFields().then(values => {
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
      if (total <= 0) {
        warning({ message: 'Số lượng không hợp lệ', description: 'Số lượng nhập phải > 0' });
        return;
      }

      if (editing) {
        update.mutate(
          { id: editing.id, data: payload },
          {
            onSuccess: () => {
              success({ message: 'Cập nhật bản ghi nhập thành công' });
              close();
            },
            onError: (e: any) =>
              error({
                message: 'Lỗi cập nhật',
                description: e?.response?.data?.message || 'Không thể cập nhật',
              }),
          }
        );
      } else {
        create.mutate(payload, {
          onSuccess: () => {
            success({ message: 'Nhập hàng thành công' });
            close();
          },
          onError: (e: any) =>
            error({
              message: 'Lỗi nhập hàng',
              description: e?.response?.data?.message || 'Không thể nhập hàng',
            }),
        });
      }
    });
  };

  return (
    <CrudModal
      open={open}
      title={editing ? 'Chỉnh sửa lần nhập' : 'Nhập hàng mới'}
      onCancel={close}
      onSubmit={onSubmit}
      submitLabel={editing ? 'Cập nhật' : 'Nhập hàng'}
      loading={create.isPending || update.isPending}
      width={760}
    >
      <Form form={form} layout="vertical" className="pt-4" autoComplete="off">
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="product_name"
              label="Tên sản phẩm"
              rules={[{ required: true, message: 'Vui lòng nhập tên SP' }]}
            >
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
            <Form.Item
              name="warehouse_id"
              label="Kho"
              rules={[{ required: true, message: 'Chọn kho' }]}
            >
              <AppSelect
                placeholder="Chọn kho"
                options={editing ? warehouseOptions : filteredWarehouseOptions}
                showSearch
                onChange={onWarehouseChange}
                filterOption={(i, o) =>
                  ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="supplier"
              label="Nhà cung cấp"
              rules={[{ required: true, message: 'Nhập NCC' }]}
            >
              <AppAutoComplete placeholder="Tên NCC" options={supplierOpts} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item name="batch" label="Lô" rules={[{ required: true, message: 'Nhập mã lô' }]}>
              <AppAutoComplete
                placeholder={batchOptions.length ? 'Chọn lô đã có hoặc nhập lô mới' : 'Mã lô'}
                options={batchOptions}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="small_unit_id"
              label="Đơn vị lẻ"
              rules={[{ required: true, message: 'Chọn đơn vị lẻ' }]}
            >
              <AppSelect placeholder="Chọn đơn vị" options={smallUnitOpts} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="expiry_date"
              label="HSD"
              rules={[{ required: true, message: 'Chọn HSD' }]}
            >
              <AppDatePicker
                placeholder="Chọn HSD"
                format={DATE_FORMAT.DISPLAY}
                className="w-full"
                disabledDate={c => c && c.isBefore(dayjs(), 'day')}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="import_date"
              label="Ngày nhập"
              rules={[{ required: true, message: 'Chọn ngày nhập' }]}
            >
              <AppDatePicker
                placeholder="Chọn ngày"
                format={DATE_FORMAT.DISPLAY}
                className="w-full"
              />
            </Form.Item>
          </Col>
        </Row>

        <div className="pb-2 mt-2 mb-2 text-base font-semibold">
          {totalPieces > 0
            ? (() => {
                const parts: string[] = [];
                if (cartonQty > 0) parts.push(`${formatNumber(cartonQty)} kiện`);
                if (pieceQty > 0)
                  parts.push(`${formatNumber(pieceQty)} ${(smallUnitLabel || 'lẻ').toLowerCase()}`);
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
            <Form.Item
              name="units_per_carton"
              label={`${smallUnitLabel || 'Lẻ'} / Kiện`}
              rules={[{ required: true, message: 'Nhập số lẻ / kiện' }]}
            >
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
  );
};
