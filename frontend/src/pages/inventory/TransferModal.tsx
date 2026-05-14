import { Col, Form, Input, Row } from 'antd';
import { useEffect, useMemo } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { AppInput } from '@/components/atoms/AppInput';
import { AppInputNumber } from '@/components/atoms/AppInput/InputNumber';
import { AppSelect } from '@/components/atoms/AppSelect';
import { CrudModal } from '@/components/organisms/crud-modal';
import { useAppNotification } from '@/components/templates/notification';
import { useTransferInventory } from '@/hooks/api/inventory';
import { formatCartonPiecesPlain, formatDate } from '@/utils/format';

interface InventoryRow {
  id: number;
  product_id: number;
  product_name: string;
  category: string | null;
  warehouse_id: number;
  warehouse_name: string;
  supplier: string;
  batch: string;
  stock_pieces: number;
  available_pieces?: number;
  pending_reserved?: number;
  units_per_carton: number | null;
  nearest_expiry: string | null;
  small_unit?: { id: number; code: string; label: string } | null;
}

interface Props {
  open: boolean;
  inventoryList: InventoryRow[];
  warehouseOptions: { label: string; value: number }[];
  onClose: () => void;
}

export const TransferModal = ({ open, inventoryList, warehouseOptions, onClose }: Props) => {
  const [form] = Form.useForm();
  const transfer = useTransferInventory();
  const { success, error, warning } = useAppNotification();

  const inventoryId = Form.useWatch('inventory_id', form);
  const cartonQty = Number(Form.useWatch('carton_quantity', form)) || 0;
  const pieceQty = Number(Form.useWatch('piece_quantity', form)) || 0;

  const inventoryOptions = useMemo(
    () =>
      inventoryList
        .map(it => {
          const avail = Number(it.available_pieces ?? it.stock_pieces) || 0;
          const pending = Number(it.pending_reserved) || 0;
          const upc = Number(it.units_per_carton) || 0;
          const unit = it.small_unit?.label || '';
          const availStr = formatCartonPiecesPlain(avail, upc, unit);
          const hint =
            pending > 0 ? ` — chờ xuất: ${formatCartonPiecesPlain(pending, upc, unit)}` : '';
          return {
            label: `${it.product_name} — ${it.warehouse_name} | ${it.supplier} | Lô: ${it.batch} (Tồn: ${availStr}${hint})`,
            value: it.id,
            record: it,
            available: avail,
          };
        })
        .filter(o => o.available > 0),
    [inventoryList]
  );

  const selected = useMemo(
    () => inventoryOptions.find(o => o.value === inventoryId)?.record || null,
    [inventoryOptions, inventoryId]
  );

  const upc = Number(selected?.units_per_carton) || 0;
  const unitLabel = selected?.small_unit?.label || '';
  const totalPieces = upc > 0 ? cartonQty * upc + pieceQty : pieceQty;
  const available = Number(selected?.available_pieces ?? selected?.stock_pieces) || 0;

  const destWarehouseOptions = useMemo(() => {
    if (!selected) return warehouseOptions;
    return warehouseOptions.filter(o => o.value !== selected.warehouse_id);
  }, [warehouseOptions, selected]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  useEffect(() => {
    form.setFieldsValue({
      warehouse_id_to: undefined,
      carton_quantity: 0,
      piece_quantity: 0,
    });
  }, [inventoryId, form]);

  useEffect(() => {
    if (!selected || totalPieces === 0) return;
    if (totalPieces > available) {
      warning({
        key: `transfer-over-stock-${selected.id}`,
        message: 'Vượt tồn kho',
        description: `Tồn hiện tại: ${formatCartonPiecesPlain(available, upc, unitLabel)}. Cần chuyển: ${formatCartonPiecesPlain(totalPieces, upc, unitLabel)}.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPieces, available, selected?.id]);

  const close = () => {
    form.resetFields();
    onClose();
  };

  const onSubmit = () => {
    form.validateFields().then(values => {
      if (!selected) {
        warning({ message: 'Chưa chọn sản phẩm', description: 'Vui lòng chọn lô hàng cần chuyển' });
        return;
      }
      if (totalPieces <= 0) {
        warning({ message: 'Số lượng không hợp lệ', description: 'Số lượng chuyển phải > 0' });
        return;
      }
      if (totalPieces > available) {
        warning({
          message: 'Vượt tồn kho',
          description: `Tồn hiện tại: ${available} ${unitLabel}. Cần chuyển: ${totalPieces} ${unitLabel}.`,
        });
        return;
      }

      transfer.mutate(
        {
          product_id: selected.product_id,
          warehouse_id_from: selected.warehouse_id,
          warehouse_id_to: Number(values.warehouse_id_to),
          supplier: selected.supplier,
          batch: selected.batch,
          quantity: totalPieces,
          note: values.note || undefined,
        },
        {
          onSuccess: () => {
            success({ message: 'Chuyển kho thành công' });
            close();
          },
          onError: (e: any) =>
            error({
              message: 'Lỗi chuyển kho',
              description: e?.response?.data?.message || 'Không thể chuyển kho',
            }),
        }
      );
    });
  };

  return (
    <CrudModal
      open={open}
      title="Chuyển kho"
      onCancel={close}
      onSubmit={onSubmit}
      submitLabel="Chuyển kho"
      loading={transfer.isPending}
      width={760}
    >
      <Form form={form} layout="vertical" className="pt-4" autoComplete="off">
        <Form.Item
          name="inventory_id"
          label="Sản phẩm cần chuyển"
          rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
        >
          <AppSelect
            allowClear
            showSearch
            placeholder="Tìm sản phẩm theo tên / kho / NCC / lô"
            options={inventoryOptions}
            filterOption={(i, o) =>
              ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
            }
          />
        </Form.Item>

        {selected && (
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Tên sản phẩm">
                <AppInput value={selected.product_name} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Loại sản phẩm">
                <AppInput value={selected.category || ''} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="NCC">
                <AppInput value={selected.supplier} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Hạn sử dụng">
                <AppInput
                  value={selected.nearest_expiry ? formatDate(selected.nearest_expiry) : '-'}
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        <div className="pt-3 pb-2 mt-2 mb-2 text-base font-semibold border-t">Chuyển kho</div>

        <Row gutter={[8, 0]} align="bottom">
          <Col xs={24} sm={11}>
            <Form.Item label="Kho hiện tại">
              <AppInput value={selected?.warehouse_name || ''} disabled placeholder="—" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={2} className="flex items-center justify-center pb-2">
            <FiArrowRight size={24} className="text-gray-500" />
          </Col>
          <Col xs={24} sm={11}>
            <Form.Item
              name="warehouse_id_to"
              label="Kho đích"
              rules={[{ required: true, message: 'Chọn kho đích' }]}
            >
              <AppSelect
                allowClear
                showSearch
                placeholder="Chọn kho đích"
                options={destWarehouseOptions}
                disabled={!selected}
                filterOption={(i, o) =>
                  ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item name="carton_quantity" label="Số kiện">
              <AppInputNumber
                decimalScale={0}
                placeholder="0"
                className="w-full"
                disabled={!selected || upc <= 1}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="piece_quantity" label={`Số ${unitLabel || 'lẻ'}`}>
              <AppInputNumber
                decimalScale={0}
                placeholder="0"
                className="w-full"
                disabled={!selected}
              />
            </Form.Item>
          </Col>
        </Row>

        {selected && (
          <div className="text-sm text-gray-600">
            Tồn hiện tại:{' '}
            <span className="font-semibold">
              {formatCartonPiecesPlain(available, upc, unitLabel)}
            </span>
            {totalPieces > 0 && (
              <>
                {' '}
                — Tổng cần chuyển:{' '}
                <span className="font-semibold">
                  {formatCartonPiecesPlain(totalPieces, upc, unitLabel)}
                </span>
              </>
            )}
          </div>
        )}

        <Form.Item name="note" label="Ghi chú" className="mt-3">
          <Input.TextArea
            placeholder="Nhập ghi chú cho lần chuyển kho (lý do, người nhận...)"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </CrudModal>
  );
};
