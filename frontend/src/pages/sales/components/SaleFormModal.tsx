import { Col, Form, Row } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { CrudModal } from '@/components/organisms/crud-modal';
import { useAppNotification } from '@/components/templates/notification';
import { DATE_FORMAT } from '@/constants/format';
import { SaleType } from '@/constants/enums';
import { paidOptions, saleTypeLabels } from '@/constants/options';
import { useCreateSale, useUpdateSale } from '@/hooks/api/sales';
import { formatCurrency, toApiDate } from '@/utils/format';
import { createEmptyLine, findInventoryFor, SaleLine, SaleOrderRow } from '../types';
import { SaleLineRow } from './SaleLineRow';

interface Props {
  open: boolean;
  editing: SaleOrderRow | null;
  defaultSaleType?: string;
  inventoryList: any[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const SaleFormModal = ({
  open,
  editing,
  defaultSaleType,
  inventoryList,
  onClose,
  onSuccess,
}: Props) => {
  const [form] = Form.useForm();
  const [lines, setLines] = useState<SaleLine[]>([]);
  const create = useCreateSale();
  const update = useUpdateSale();
  const currentSaleType = Form.useWatch('saleType', form);
  const { success, error, warning } = useAppNotification();

  const inventoryOptions = useMemo(
    () =>
      inventoryList.map((it: any) => ({
        label: `${it.product_name} — ${it.warehouse_name} | NCC: ${it.supplier} | Lô: ${it.batch} (Tồn: ${it.stock_pieces} ${it.small_unit?.label || ''})`,
        value: it.id,
        record: it,
      })),
    [inventoryList]
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        customerName: editing.customer_name,
        customerPhone: editing.customer_phone,
        customerAddress: editing.customer_address,
        brokerName: editing.broker_name || undefined,
        saleType: editing.sale_type,
        paid: editing.paid,
        saleDate: editing.sale_date ? dayjs(editing.sale_date) : undefined,
      });
      const enriched = editing.items.map(it => {
        const inv = findInventoryFor(inventoryList, it);
        const upc = Number(inv?.units_per_carton) || 0;
        const carton = upc > 0 ? Math.floor(it.quantity / upc) : 0;
        const piece = upc > 0 ? it.quantity % upc : it.quantity;
        return {
          ...it,
          inventory_id: inv?.id,
          available: inv?.stock_pieces || 0,
          units_per_carton: upc,
          carton_quantity: carton,
          piece_quantity: piece,
        };
      });
      setLines(enriched);
    } else {
      form.resetFields();
      form.setFieldsValue({
        saleDate: dayjs(),
        saleType: defaultSaleType || SaleType.RETAIL,
        paid: false,
      });
      setLines([]);
    }
  }, [open, editing, defaultSaleType, inventoryList, form]);

  const close = () => {
    form.resetFields();
    setLines([]);
    onClose();
  };

  const addLine = () => setLines(prev => [...prev, createEmptyLine()]);

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const updateLine = (idx: number, patch: Partial<SaleLine>) => {
    let overStock: SaleLine | null = null;
    setLines(prev => {
      const next = [...prev];
      const merged = { ...next[idx], ...patch };
      const upc = merged.units_per_carton || 0;
      merged.quantity = (merged.carton_quantity || 0) * upc + (merged.piece_quantity || 0);
      merged.total = merged.quantity * merged.unit_price;
      next[idx] = merged;
      if (merged.product_id && merged.quantity > merged.available) {
        overStock = merged;
      }
      return next;
    });
    if (overStock) {
      const l = overStock as SaleLine;
      warning({
        key: `over-stock-${idx}`,
        message: 'Vượt tồn kho',
        description: `Sản phẩm "${l.product_name}" (lô ${l.batch}) vượt tồn: cần ${l.quantity}, còn ${l.available} ${l.small_unit_label}`,
      });
    }
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
      units_per_carton: Number(r.units_per_carton) || 0,
      carton_quantity: 0,
      piece_quantity: 0,
      unit_price: 0,
      quantity: 0,
      total: 0,
    });
  };

  const onSubmit = () => {
    form.validateFields().then(values => {
      if (lines.length === 0) {
        warning({ message: 'Thiếu sản phẩm', description: 'Phải có ít nhất 1 sản phẩm' });
        return;
      }
      for (const l of lines) {
        if (!l.product_id) {
          warning({ message: 'Thiếu sản phẩm', description: 'Chọn SP cho mọi dòng' });
          return;
        }
        if (l.quantity <= 0) {
          warning({
            message: 'Số lượng không hợp lệ',
            description: `Số lượng SP "${l.product_name}" phải > 0 (số kiện hoặc số lẻ)`,
          });
          return;
        }
        if (l.quantity > l.available) {
          warning({
            message: 'Vượt tồn kho',
            description: `Tồn không đủ cho "${l.product_name}" (lô ${l.batch}): còn ${l.available} ${l.small_unit_label}, cần ${l.quantity}`,
          });
          return;
        }
      }

      const payload = {
        customerName: values.customerName,
        customerPhone: values.customerPhone || '',
        customerAddress: values.customerAddress || '',
        brokerName: values.saleType === SaleType.BROKER ? values.brokerName || '' : '',
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
        update.mutate(
          { id: editing.id, data: payload },
          {
            onSuccess: () => {
              success({ message: 'Cập nhật hóa đơn thành công' });
              onSuccess?.();
              close();
            },
            onError: (e: any) =>
              error({
                message: 'Lỗi cập nhật',
                description: e?.response?.data?.message || 'Không thể cập nhật hóa đơn',
              }),
          }
        );
      } else {
        create.mutate(payload, {
          onSuccess: () => {
            success({ message: 'Tạo hóa đơn thành công' });
            onSuccess?.();
            close();
          },
          onError: (e: any) =>
            error({
              message: 'Lỗi tạo hóa đơn',
              description: e?.response?.data?.message || 'Không thể tạo hóa đơn',
            }),
        });
      }
    });
  };

  return (
    <CrudModal
      open={open}
      title={
        editing
          ? `Chỉnh sửa hóa đơn`
          : `Tạo hóa đơn xuất hàng (${saleTypeLabels[currentSaleType || '']?.label || ''})`
      }
      onCancel={close}
      onSubmit={onSubmit}
      submitLabel={editing ? 'Cập nhật' : 'Tạo hóa đơn'}
      loading={create.isPending || update.isPending}
      width={1100}
    >
      <Form form={form} layout="vertical" className="pt-4" autoComplete="off">
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="customerName"
              label={currentSaleType === SaleType.WHOLESALE ? 'Tên đơn hàng' : 'Tên khách hàng'}
              rules={[{ required: true }]}
            >
              <AppInput
                placeholder={
                  currentSaleType === SaleType.WHOLESALE ? 'Tên đơn hàng' : 'Tên khách hàng'
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="customerPhone" label="SĐT">
              <AppInput placeholder="SĐT" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="saleDate" label="Ngày bán" rules={[{ required: true }]}>
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
        {currentSaleType === SaleType.BROKER && (
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={16}>
              <Form.Item
                name="brokerName"
                label="Tên nhà môi giới"
                rules={[{ required: true, message: 'Vui lòng nhập tên nhà môi giới' }]}
              >
                <AppInput placeholder="Tên nhà môi giới" />
              </Form.Item>
            </Col>
          </Row>
        )}
        <Form.Item name="saleType" hidden>
          <AppInput />
        </Form.Item>

        <div className="flex items-center justify-between pt-2 mt-2 mb-2 border-t">
          <h4 className="m-0 text-base font-semibold">Danh sách sản phẩm bán</h4>
          <AppButton icon={<FiPlus />} onClick={addLine} type="default">
            Thêm sản phẩm
          </AppButton>
        </div>
        {lines.length === 0 && (
          <p className="py-4 text-sm text-center text-gray-400">
            Chưa có sản phẩm nào — bấm "Thêm sản phẩm" để chọn từ kho.
          </p>
        )}
        {lines.map((line, idx) => {
          const usedProductNames = new Set(
            lines
              .filter((l, i) => i !== idx && l.product_name)
              .map(l => l.product_name)
          );
          const optsForThisLine = inventoryOptions.filter(
            o => !usedProductNames.has(o.record.product_name)
          );
          return (
            <SaleLineRow
              key={idx}
              idx={idx}
              isFirst={idx === 0}
              line={line}
              inventoryOptions={optsForThisLine}
              onPick={onPickInventory}
              onUpdate={updateLine}
              onRemove={removeLine}
            />
          );
        })}
        {lines.length > 0 && (
          <div className="text-lg font-bold text-right">
            Tổng:{' '}
            <span className="text-primary">
              {formatCurrency(lines.reduce((s, l) => s + l.total, 0))}
            </span>
          </div>
        )}
      </Form>
    </CrudModal>
  );
};
