import { Col, Form, Row } from 'antd';
import { FiTrash2 } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { AppInputNumber } from '@/components/atoms/AppInput/InputNumber';
import { AppSelect } from '@/components/atoms/AppSelect';
import { formatCurrency } from '@/utils/format';
import { SaleLine } from '../types';

interface Props {
  idx: number;
  isFirst: boolean;
  line: SaleLine;
  inventoryOptions: { label: string; value: number; record: any }[];
  onPick: (idx: number, inventoryId: number) => void;
  onUpdate: (idx: number, patch: Partial<SaleLine>) => void;
  onRemove: (idx: number) => void;
}

export const SaleLineRow = ({
  idx,
  isFirst,
  line,
  inventoryOptions,
  onPick,
  onUpdate,
  onRemove,
}: Props) => (
  <Row gutter={[8, 0]} className="items-end pb-2 mb-2 border-b">
    <Col xs={26} md={9}>
      <Form.Item label={isFirst ? 'Chọn từ tồn kho' : ''} className="mb-1">
        <AppSelect
          showSearch
          placeholder="Chọn sản phẩm tồn"
          value={line.inventory_id}
          options={inventoryOptions}
          filterOption={(i, o) =>
            ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
          }
          onChange={v => onPick(idx, v)}
        />
      </Form.Item>
    </Col>
    <Col xs={12} md={3}>
      <Form.Item label={isFirst ? `Số kiện` : ''} className="mb-1">
        <AppInputNumber
          decimalScale={0}
          value={line.carton_quantity || undefined}
          placeholder="0"
          className="w-full"
          onValueChange={v => onUpdate(idx, { carton_quantity: v.floatValue || 0 })}
        />
      </Form.Item>
    </Col>
    <Col xs={12} md={3}>
      <Form.Item label={isFirst ? `Số lẻ` : ''} className="mb-1">
        <AppInputNumber
          decimalScale={0}
          value={line.piece_quantity || undefined}
          placeholder="0"
          className="w-full"
          onValueChange={v => onUpdate(idx, { piece_quantity: v.floatValue || 0 })}
        />
      </Form.Item>
    </Col>
    <Col xs={12} md={3}>
      <Form.Item label={isFirst ? 'Đơn giá' : ''} className="mb-1">
        <AppInputNumber
          decimalScale={0}
          value={line.unit_price || undefined}
          placeholder="0"
          className="w-full"
          onValueChange={v => onUpdate(idx, { unit_price: v.floatValue || 0 })}
        />
      </Form.Item>
    </Col>
    <Col xs={20} md={5}>
      <Form.Item label={isFirst ? 'Thành tiền' : ''} className="mb-1">
        <div className="font-semibold">{formatCurrency(line.total)}</div>
        {line.quantity > 0 && (
          <div className="text-xs text-gray-500">
            Tổng: {line.quantity} {line.small_unit_label} (1 kiện = {line.units_per_carton}{' '}
            {line.small_unit_label})
          </div>
        )}
      </Form.Item>
    </Col>
    <Col xs={2} md={1}>
      <Form.Item label={isFirst ? ' ' : ''} className="mb-1">
        <AppButton danger icon={<FiTrash2 />} onClick={() => onRemove(idx)} />
      </Form.Item>
    </Col>
  </Row>
);
