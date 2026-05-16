import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppInputNumber } from '@/components/atoms/AppInput/InputNumber';
import { AppSelect } from '@/components/atoms/AppSelect';
import { CrudModal } from '@/components/organisms/crud-modal';
import { useAppNotification } from '@/components/templates/notification';
import { DATE_FORMAT } from '@/constants/format';
import { useCreateImport, useUpdateImport } from '@/hooks/api/imports';
import { useGetProductCategories } from '@/hooks/api/products';
import { useGetSmallUnitOptions } from '@/hooks/api/small-units';
import { formatNumber } from '@/utils/format';
import { Col, Form, Row, Segmented } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ImportRecord } from '../types';
import './ImportFormModal.scss';

interface Props {
  open: boolean;
  editing: ImportRecord | null;
  warehouseOptions: { label: string; value: number }[];
  productList: any[];
  productNameOpts: { label: string; value: string }[];
  allImports: ImportRecord[];
  onClose: () => void;
}

export const ImportFormModal = ({
  open,
  editing,
  warehouseOptions,
  productList,
  productNameOpts,
  allImports,
  onClose,
}: Props) => {
  const [form] = Form.useForm();
  const create = useCreateImport();
  const update = useUpdateImport();
  const { success, error, warning } = useAppNotification();

  // Chỉ fetch khi modal mở — react-query cache 5 phút nên mở lại không refetch.
  const { data: smallUnitsRes } = useGetSmallUnitOptions({ enabled: open });
  const { data: catRes } = useGetProductCategories({ enabled: open });
  const smallUnitOpts = smallUnitsRes?.data || [];
  const categoryOpts = catRes?.data || [];

  const [inputMode, setInputMode] = useState<'kien' | 'vien'>('kien');

  const QUANTITY_FIELDS = [
    'carton_quantity',
    'units_per_carton',
    'piece_quantity',
    'total_pieces_input',
    'units_per_box',
  ] as const;

  const cartonQty = Number(Form.useWatch('carton_quantity', form)) || 0;
  const unitsPer = Number(Form.useWatch('units_per_carton', form)) || 0;
  const pieceQty = Number(Form.useWatch('piece_quantity', form)) || 0;
  const totalPiecesInput = Number(Form.useWatch('total_pieces_input', form)) || 0;
  const unitsPerBox = Number(Form.useWatch('units_per_box', form)) || 0;
  const smallUnitId = Form.useWatch('small_unit_id', form);
  const productNameWatch = Form.useWatch('product_name', form);
  const warehouseIdWatch = Form.useWatch('warehouse_id', form);
  const supplierWatch = Form.useWatch('supplier', form);
  const batchWatch = Form.useWatch('batch', form);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const mode: 'kien' | 'vien' = editing.input_total_pieces != null ? 'vien' : 'kien';
      setInputMode(mode);
      const totalPiecesEdit =
        editing.input_total_pieces ??
        (editing.carton_quantity || 0) * (editing.units_per_carton || 1) +
          (editing.piece_quantity || 0);
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
        total_pieces_input: mode === 'vien' ? totalPiecesEdit : undefined,
        units_per_box: editing.units_per_box ?? undefined,
        expiry_date: editing.expiry_date ? dayjs(editing.expiry_date) : undefined,
        import_date: editing.import_date ? dayjs(editing.import_date) : undefined,
      });
    } else {
      setInputMode('kien');
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

  const batchOptions = useMemo(() => {
    if (!isExistingProduct || !warehouseIdWatch) return [];
    const batches = Array.from(
      new Set(
        productImports.filter(i => i.warehouse_id === Number(warehouseIdWatch)).map(i => i.batch)
      )
    );
    return batches.map(b => ({ label: b, value: b }));
  }, [isExistingProduct, warehouseIdWatch, productImports]);

  const matchedImport = useMemo(() => {
    if (editing || !matchedProduct || !warehouseIdWatch || !supplierWatch || !batchWatch) {
      return null;
    }
    return (
      productImports.find(
        i =>
          i.warehouse_id === Number(warehouseIdWatch) &&
          i.supplier === supplierWatch &&
          i.batch === batchWatch
      ) || null
    );
  }, [editing, matchedProduct, productImports, warehouseIdWatch, supplierWatch, batchWatch]);

  const prevMatchedIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (editing) return;
    const prevId = prevMatchedIdRef.current;
    if (matchedImport) {
      const matchedMode: 'kien' | 'vien' =
        matchedImport.input_total_pieces != null ? 'vien' : 'kien';
      setInputMode(matchedMode);
      form.setFieldsValue({
        units_per_carton: matchedImport.units_per_carton,
        units_per_box: matchedImport.units_per_box ?? undefined,
        small_unit_id: matchedImport.small_unit_id ?? form.getFieldValue('small_unit_id'),
      });
      prevMatchedIdRef.current = matchedImport.id;
    } else if (prevId != null) {
      form.resetFields(['units_per_carton', 'units_per_box']);
      prevMatchedIdRef.current = null;
    }
  }, [matchedImport, editing, form]);

  const lockUpc = !!matchedImport;
  const lockVienBox = !!matchedImport && matchedImport.units_per_box != null;

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
    form.resetFields(['units_per_carton', 'units_per_box']);
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
    form.resetFields(['units_per_carton', 'units_per_box']);
  };

  const smallUnitLabel = smallUnitOpts.find((s: any) => s.value === smallUnitId)?.label || '';
  const boxLabel = (smallUnitLabel || 'hộp').toLowerCase();
  const totalPieces = inputMode === 'kien' ? cartonQty * unitsPer + pieceQty : totalPiecesInput;

  const close = () => {
    form.resetFields();
    onClose();
  };

  const onSubmit = () => {
    form.validateFields().then(values => {
      let carton_quantity = Number(values.carton_quantity || 0);
      let units_per_carton = Number(values.units_per_carton || 1);
      let piece_quantity = Number(values.piece_quantity || 0);

      if (inputMode === 'vien') {
        const totalVien = Number(values.total_pieces_input || 0);
        const vienPerHop = Number(values.units_per_box || 0);
        const hopPerKien = Number(values.units_per_carton || 0);
        const totalHop = vienPerHop > 0 ? Math.floor(totalVien / vienPerHop) : 0;
        if (hopPerKien > 0 && totalHop > 0 && hopPerKien > totalHop) {
          warning({
            message: 'Số hộp / kiện vượt quá số lượng thực tế',
            description: `Tổng chỉ có ${totalHop} ${boxLabel} (= ${totalVien} viên / ${vienPerHop} viên/${boxLabel}), không thể đặt ${hopPerKien} ${boxLabel}/kiện.`,
          });
          return;
        }
        units_per_carton = hopPerKien > 0 ? hopPerKien : 1;
        if (units_per_carton > 1) {
          carton_quantity = Math.floor(totalHop / units_per_carton);
          piece_quantity = totalHop - carton_quantity * units_per_carton;
        } else {
          carton_quantity = 0;
          piece_quantity = totalHop;
        }
      }

      const payload = {
        product_name: values.product_name,
        category: values.category,
        warehouse_id: Number(values.warehouse_id),
        supplier: values.supplier,
        batch: values.batch,
        small_unit_id: Number(values.small_unit_id),
        carton_quantity,
        units_per_carton,
        piece_quantity,
        expiry_date: dayjs(values.expiry_date).format('YYYY-MM-DD'),
        import_date: dayjs(values.import_date).format('YYYY-MM-DD'),
        input_mode: inputMode,
        input_total_pieces:
          inputMode === 'vien' ? Number(values.total_pieces_input || 0) || null : null,
        units_per_box: inputMode === 'vien' ? Number(values.units_per_box || 0) || null : null,
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
      title={editing ? 'Chỉnh sửa nhập' : 'Nhập hàng mới'}
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
              rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
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
                allowClear
                placeholder="Chọn kho"
                options={warehouseOptions}
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
              label="NCC"
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
            <Form.Item name="expiry_date" label="HSD">
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

        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 mt-2 mb-2">
          <div className="text-base font-semibold">
            {totalPieces > 0
              ? (() => {
                  if (inputMode === 'kien') {
                    const parts: string[] = [];
                    if (cartonQty > 0) parts.push(`${formatNumber(cartonQty)} kiện`);
                    if (pieceQty > 0)
                      parts.push(
                        `${formatNumber(pieceQty)} ${(smallUnitLabel || 'lẻ').toLowerCase()}`
                      );
                    return `Số lượng nhập (${parts.join(', ')} = tổng ${formatNumber(totalPieces)} ${smallUnitLabel})`;
                  }
                  const looseVien = unitsPerBox > 0 ? totalPieces % unitsPerBox : 0;
                  const parts: string[] = [`${formatNumber(totalPieces)} viên`];
                  if (unitsPerBox > 0) {
                    const totalHop = Math.floor(totalPieces / unitsPerBox);
                    parts.push(`${formatNumber(totalHop)} ${boxLabel}`);
                    if (unitsPer > 0 && totalHop > 0) {
                      const totalKien = Math.floor(totalHop / unitsPer);
                      const looseHop = totalHop - totalKien * unitsPer;
                      if (totalKien > 0) {
                        const kienHopParts: string[] = [`${formatNumber(totalKien)} kiện`];
                        if (looseHop > 0)
                          kienHopParts.push(`${formatNumber(looseHop)} ${boxLabel}`);
                        parts.push(kienHopParts.join(' + '));
                      }
                    }
                  }
                  const main = `Số lượng nhập (${parts.join(' = ')})`;
                  return looseVien > 0 ? `${main} lẻ ${formatNumber(looseVien)} viên` : main;
                })()
              : 'Số lượng nhập'}
          </div>
          <Segmented
            className="import-mode-segmented"
            value={inputMode}
            disabled={!!matchedImport}
            onChange={val => {
              setInputMode(val as 'kien' | 'vien');
              form.resetFields([...QUANTITY_FIELDS]);
            }}
            options={[
              { label: 'Nhập kiện', value: 'kien' },
              { label: 'Nhập viên', value: 'vien' },
            ]}
          />
        </div>
        {inputMode === 'kien' ? (
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="carton_quantity" label="Số kiện">
                <AppInputNumber placeholder="0" decimalScale={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="units_per_carton"
                label={`Số ${smallUnitLabel || 'Lẻ'} / kiện`}
                rules={[
                  { required: true, message: 'Nhập số ' + (smallUnitLabel || 'Lẻ') + ' / kiện' },
                ]}
              >
                <AppInputNumber
                  placeholder="1"
                  decimalScale={0}
                  className="w-full"
                  disabled={lockUpc || !!editing}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="piece_quantity" label={`Số ${smallUnitLabel || 'lẻ'} (ngoài kiện)`}>
                <AppInputNumber placeholder="0" decimalScale={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>
        ) : (
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="total_pieces_input"
                label="Tổng số viên"
                rules={[{ required: true, message: 'Nhập tổng số viên' }]}
              >
                <AppInputNumber placeholder="0" decimalScale={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="units_per_box"
                label={`Số viên / ${boxLabel}`}
                rules={[{ required: true, message: `Nhập số viên / ${boxLabel}` }]}
              >
                <AppInputNumber
                  placeholder="0"
                  decimalScale={0}
                  className="w-full"
                  disabled={lockVienBox || !!editing}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="units_per_carton"
                label={`Số ${boxLabel} / kiện`}
                rules={[{ required: true, message: `Nhập số ${boxLabel} / kiện` }]}
              >
                <AppInputNumber
                  placeholder="0"
                  decimalScale={0}
                  className="w-full"
                  disabled={lockUpc || !!editing}
                />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </CrudModal>
  );
};
