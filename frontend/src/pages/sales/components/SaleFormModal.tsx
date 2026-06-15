import { Alert, Col, Form, Row, Spin } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppButton } from '@/components/atoms/AppButton';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { CrudModal } from '@/components/organisms/crud-modal';
import { useAppNotification } from '@/components/templates/notification';
import { DATE_FORMAT } from '@/constants/format';
import { SaleType } from '@/constants/enums';
import { paymentStatusOptions, saleTypeLabels } from '@/constants/options';
import { PaymentStatus } from '@/constants/enums';
import { useCreateSale, useGetSaleDetail, useGetSales, useUpdateSale } from '@/hooks/api/sales';
import { useGetInventory } from '@/hooks/api/inventory';
import { formatCartonPiecesPlain, formatCurrency, getErrorMessage, toApiDate } from '@/utils/format';
import { canEditOrder, canEditProducts, isPendingOrder } from '../statusRules';
import { createEmptyLine, findInventoryFor, mapSaleItems, SaleLine, SaleOrderRow } from '../types';
import { SaleLineRow } from './SaleLineRow';

interface Props {
  open: boolean;
  editing: SaleOrderRow | null;
  defaultSaleType?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SaleFormModal = ({
  open,
  editing,
  defaultSaleType,
  onClose,
  onSuccess,
}: Props) => {
  const [form] = Form.useForm();
  const [lines, setLines] = useState<SaleLine[]>([]);
  const create = useCreateSale();
  const update = useUpdateSale();
  const currentSaleType = Form.useWatch('saleType', form);
  const canEditProductSection = canEditProducts(editing);
  const isEditingPendingOrder = isPendingOrder(editing);
  const isProductSectionDisabled = !canEditProductSection;
  const paymentStatusSelectOptions = useMemo(() => {
    if (!editing) {
      return paymentStatusOptions.filter(option => option.value === PaymentStatus.PENDING);
    }
    if (isEditingPendingOrder) {
      return paymentStatusOptions.filter(option =>
        [
          PaymentStatus.PENDING,
          PaymentStatus.PAID,
          PaymentStatus.UNPAID,
          PaymentStatus.CANCELLED,
        ].includes(option.value as PaymentStatus)
      );
    }
    return paymentStatusOptions.filter(
      option => option.value !== PaymentStatus.CANCELLED || option.value === editing.payment_status
    );
  }, [editing, isEditingPendingOrder]);
  const { success, error, warning } = useAppNotification();

  // Inventory mặc định (create mode): chỉ fetch khi modal mở.
  const createInvQuery = useGetInventory(undefined, { enabled: open && !editing });
  // Edit mode: fetch toàn bộ inventory (kể cả lô đã hết) và bỏ trừ pending của
  // chính đơn này — nếu không, các lô đã bán hết sẽ không nằm trong list,
  // khiến danh sách sản phẩm trong modal không fill được thông tin.
  const editInvQuery = useGetInventory(
    editing && open ? { includeEmpty: true, exclude_pending_sale_order_id: editing.id } : undefined,
    { enabled: !!editing && open }
  );
  const effectiveInventoryList: any[] = useMemo(
    () =>
      editing && open
        ? editInvQuery.data?.data || []
        : createInvQuery.data?.data || [],
    [editing, open, editInvQuery.data, createInvQuery.data]
  );

  // Fetch chi tiết đơn (items) — list không trả items để tối ưu tốc độ.
  const detailQuery = useGetSaleDetail(editing?.id ?? null, !!editing && open);
  const editingItems = useMemo(
    () => mapSaleItems(detailQuery.data?.data?.items),
    [detailQuery.data]
  );

  const editingInventoryIds = useMemo(() => {
    if (!editing) return new Set<number>();
    const ids = new Set<number>();
    editingItems.forEach(it => {
      const inv = findInventoryFor(effectiveInventoryList, it);
      if (inv?.id) ids.add(inv.id);
    });
    return ids;
  }, [editing, editingItems, effectiveInventoryList]);

  const inventoryOptions = useMemo(
    () =>
      [...effectiveInventoryList]
        .filter((it: any) => {
          // Ẩn lô hết tồn ra khỏi dropdown, trừ khi nó đang được dùng trong đơn edit.
          const stock = Number(it.available_pieces ?? it.stock_pieces) || 0;
          return stock > 0 || editingInventoryIds.has(it.id);
        })
        .sort((a: any, b: any) => {
          const byName = (a.product_name || '').localeCompare(b.product_name || '', 'vi');
          if (byName !== 0) return byName;
          const byWh = (a.warehouse_name || '').localeCompare(b.warehouse_name || '', 'vi');
          if (byWh !== 0) return byWh;
          return (a.batch || '').localeCompare(b.batch || '', 'vi');
        })
        .map((it: any) => {
          const unit = it.small_unit?.label || '';
          const upc = Number(it.units_per_carton) || 0;
          const pending = Number(it.pending_reserved) || 0;
          const available = Number(it.available_pieces ?? it.stock_pieces) || 0;
          const availableStr = formatCartonPiecesPlain(available, upc, unit);
          const pendingHint =
            pending > 0 ? ` — chờ xuất: ${formatCartonPiecesPlain(pending, upc, unit)}` : '';
          return {
            label: `${it.product_name} — ${it.warehouse_name} | ${it.supplier} | Lô: ${it.batch} (Tồn: ${availableStr}${pendingHint})`,
            value: it.id,
            record: it,
          };
        }),
    [effectiveInventoryList, editingInventoryIds]
  );

  const { data: brokerSalesRes } = useGetSales(
    { sale_type: SaleType.BROKER, limit: 100000 },
    { enabled: open && currentSaleType === SaleType.BROKER }
  );
  const { data: retailSalesRes } = useGetSales(
    { sale_type: SaleType.RETAIL, limit: 100000 },
    { enabled: open && currentSaleType === SaleType.RETAIL }
  );
  const brokerNameOpts = useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    (brokerSalesRes?.data || []).forEach((sale: any) => {
      const name = String(sale.broker_name || '').trim();
      if (!name) return;
      const key = name.toLocaleLowerCase('vi');
      if (!map.has(key)) map.set(key, { label: name, value: name });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [brokerSalesRes]);
  const retailCustomerNameOpts = useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    (retailSalesRes?.data || []).forEach((sale: any) => {
      const name = String(sale.customer_name || '').trim();
      if (!name) return;
      const key = name.toLocaleLowerCase('vi');
      if (!map.has(key)) map.set(key, { label: name, value: name });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [retailSalesRes]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        customerName: editing.customer_name,
        customerPhone: editing.customer_phone,
        customerAddress: editing.customer_address,
        brokerName: editing.broker_name || undefined,
        saleType: editing.sale_type,
        paymentStatus: editing.returned ? PaymentStatus.PENDING : editing.payment_status,
        saleDate: editing.sale_date ? dayjs(editing.sale_date) : undefined,
      });
      // Đợi cả detail (items) và inventory edit-mode load xong rồi mới enrich.
      if (editInvQuery.isLoading || !editInvQuery.data) return;
      if (detailQuery.isLoading || !detailQuery.data) return;
      const isEditingPending = editing.payment_status === 'pending';
      const enriched = editingItems.map(it => {
        const inv = findInventoryFor(effectiveInventoryList, it);
        // Ưu tiên upc từ item (BE đã trả từ stock_imports), fallback inventory.
        const upc = Number(it.units_per_carton) || Number(inv?.units_per_carton) || 0;
        const carton = upc > 0 ? Math.floor(it.quantity / upc) : 0;
        const piece = upc > 0 ? it.quantity % upc : it.quantity;
        // Khi edit đơn pending, cộng lại số lượng của chính line này vào available
        // vì available_pieces đang trừ tất cả pending (kể cả của đơn này).
        const baseAvail = Number(inv?.available_pieces ?? inv?.stock_pieces) || 0;
        const ownQty = isEditingPending ? Number(it.quantity) || 0 : 0;
        return {
          ...it,
          inventory_id: inv?.id,
          available: baseAvail + ownQty,
          units_per_carton: upc,
          carton_quantity: carton,
          piece_quantity: piece,
        };
      });
      setLines(enriched);
    } else {
      form.resetFields();
      const initialSaleType = defaultSaleType || SaleType.RETAIL;
      form.setFieldsValue({
        saleDate: dayjs(),
        saleType: initialSaleType,
        paymentStatus: PaymentStatus.PENDING,
      });
      setLines([]);
    }
  }, [
    open,
    editing,
    defaultSaleType,
    effectiveInventoryList,
    editInvQuery.isLoading,
    editInvQuery.data,
    editingItems,
    detailQuery.isLoading,
    detailQuery.data,
    form,
  ]);

  const close = () => {
    form.resetFields();
    setLines([]);
    onClose();
  };

  const addLine = () => {
    if (isProductSectionDisabled) return;
    setLines(prev => [createEmptyLine(), ...prev]);
  };

  const removeLine = (idx: number) => {
    if (isProductSectionDisabled) return;
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, patch: Partial<SaleLine>) => {
    if (isProductSectionDisabled) return;
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
    if (isProductSectionDisabled) return;
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
      available: Number(r.available_pieces ?? r.stock_pieces) || 0,
      units_per_carton: Number(r.units_per_carton) || 0,
      carton_quantity: 0,
      piece_quantity: 0,
      unit_price: 0,
      quantity: 0,
      total: 0,
    });
  };

  const onSubmit = () => {
    if (!canEditOrder(editing)) return;
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
        if (!isProductSectionDisabled && l.quantity > l.available) {
          warning({
            message: 'Vượt tồn khả dụng',
            description: `Tồn khả dụng không đủ cho "${l.product_name}" (lô ${l.batch}): còn ${l.available} ${l.small_unit_label} (đã trừ các đơn chờ xuất), cần ${l.quantity}`,
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
        paymentStatus: values.paymentStatus || PaymentStatus.PENDING,
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
                description: getErrorMessage(e, 'Không thể cập nhật hóa đơn'),
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
              description: getErrorMessage(e, 'Không thể tạo hóa đơn'),
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
      submitDisabled={!canEditOrder(editing)}
      loading={create.isPending || update.isPending}
      width={1100}
    >
      <Spin spinning={!!editing && (detailQuery.isLoading || editInvQuery.isLoading)}>
        <Form form={form} layout="vertical" className="pt-4" autoComplete="off">
          {editing?.returned && (
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="Đơn hàng này đang ở trạng thái đã hoàn hàng"
              description="Lưu thay đổi sẽ tái xuất hàng theo danh sách sản phẩm bên dưới và khôi phục đơn về trạng thái bình thường. Tồn kho sẽ được trừ lại theo các lô bạn chọn."
            />
          )}
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="customerName"
                label={currentSaleType === SaleType.WHOLESALE ? 'Tên đơn hàng' : 'Tên khách hàng'}
                rules={[{ required: true }]}
              >
                {currentSaleType === SaleType.RETAIL ? (
                  <AppAutoComplete
                    allowClear
                    disabled={!canEditOrder(editing)}
                    placeholder="Nhập hoặc chọn khách hàng bán lẻ"
                    options={retailCustomerNameOpts}
                    filterOption={(i, o) =>
                      ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
                    }
                  />
                ) : (
                  <AppInput
                    disabled={!canEditOrder(editing)}
                    placeholder={
                      currentSaleType === SaleType.WHOLESALE ? 'Tên đơn hàng' : 'Tên khách hàng'
                    }
                  />
                )}
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="customerPhone" label="SĐT">
                <AppInput placeholder="SĐT" disabled={!canEditOrder(editing)} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="saleDate" label="Ngày bán" rules={[{ required: true }]}>
                <AppDatePicker format={DATE_FORMAT.DISPLAY} className="w-full" disabled={!canEditOrder(editing)} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={16}>
              <Form.Item name="customerAddress" label="Địa chỉ">
                <AppInput placeholder="Địa chỉ" disabled={!canEditOrder(editing)} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="paymentStatus" label="Trạng thái" rules={[{ required: true }]}>
                <AppSelect
                  options={paymentStatusSelectOptions}
                  disabled={!editing || !!editing?.returned || !canEditOrder(editing)}
                />
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
                  <AppAutoComplete
                    disabled={!canEditOrder(editing)}
                    placeholder="Nhập hoặc chọn nhà môi giới"
                    options={brokerNameOpts}
                    filterOption={(i, o) =>
                      ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
          <Form.Item name="saleType" hidden>
            <AppInput />
          </Form.Item>

          <div className="flex items-center justify-between pt-2 mt-2 mb-2 border-t">
            <h4 className="m-0 text-base font-semibold">Danh sách sản phẩm bán</h4>
            <AppButton
              icon={<FiPlus />}
              onClick={addLine}
              type="default"
              disabled={isProductSectionDisabled || !canEditOrder(editing)}
            >
              Thêm sản phẩm
            </AppButton>
          </div>
          {isProductSectionDisabled && (
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="Chỉ đơn hàng ở trạng thái Chờ xuất hàng mới được chỉnh sửa sản phẩm"
            />
          )}
          {lines.length === 0 && (
            <p className="py-4 text-sm text-center text-gray-400">
              Chưa có sản phẩm nào — bấm "Thêm sản phẩm" để chọn từ kho.
            </p>
          )}
          {lines.map((line, idx) => {
            const usedInventoryIds = new Set(
              lines.filter((l, i) => i !== idx && l.inventory_id).map(l => l.inventory_id)
            );
            const optsForThisLine = inventoryOptions.filter(
              o => !usedInventoryIds.has(o.record.id)
            );
            return (
              <SaleLineRow
                key={line._clientId}
                idx={idx}
                isFirst={idx === 0}
                line={line}
                disabled={isProductSectionDisabled}
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
      </Spin>
    </CrudModal>
  );
};
