import { Descriptions, Table as AntTable, Tag } from 'antd';
import { useMemo } from 'react';
import { FiDownload } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { AppModal } from '@/components/atoms/AppModal';
import { AppTable } from '@/components/atoms/AppTable/AppTable';
import { SaleType } from '@/constants/enums';
import { paymentStatusLabels, saleTypeLabels } from '@/constants/options';
import { useGetSaleDetail } from '@/hooks/api/sales';
import { formatCurrency, formatDate } from '@/utils/format';
import { renderCartonPieces } from '@/utils/quantity';
import { mapSaleItems, SaleOrderRow } from '../types';
import { exportSaleDetailExcel } from '../utils';

interface Props {
  open: boolean;
  viewing: SaleOrderRow | null;
  onClose: () => void;
}

export const SaleDetailModal = ({ open, viewing, onClose }: Props) => {
  const { data: detailRes, isLoading } = useGetSaleDetail(
    viewing?.id ?? null,
    open && !!viewing
  );
  const detailItems = useMemo(
    () => mapSaleItems(detailRes?.data?.items),
    [detailRes]
  );

  const enrichedItems = useMemo(() => {
    return detailItems.map(it => {
      const upc = Number(it.units_per_carton) || 0;
      const carton = upc > 0 ? Math.floor(it.quantity / upc) : 0;
      const piece = upc > 0 ? it.quantity % upc : it.quantity;
      return { ...it, units_per_carton: upc, carton_quantity: carton, piece_quantity: piece };
    });
  }, [detailItems]);

  return (
    <AppModal
      open={open}
      title="Chi tiết hóa đơn"
      onCancel={onClose}
      width={1440}
      footer={
        <div className="flex justify-end gap-3 pt-2">
          <AppButton type="primary" onClick={onClose}>
            Đóng
          </AppButton>
          <AppButton
            icon={<FiDownload />}
            type="default"
            disabled={!viewing || enrichedItems.length === 0}
            onClick={() => viewing && exportSaleDetailExcel(viewing, enrichedItems)}
          >
            Xuất Excel
          </AppButton>
        </div>
      }
    >
      {viewing && (
        <div className="pt-2">
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2, md: 3 }}
            className="mb-4"
            labelStyle={{ fontWeight: 600, width: 140 }}
          >
            <Descriptions.Item
              label={viewing.sale_type === SaleType.WHOLESALE ? 'Đơn hàng' : 'Khách hàng'}
            >
              <span className="font-bold">{viewing.customer_name || '—'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="SĐT">{viewing.customer_phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày bán">{formatDate(viewing.sale_date)}</Descriptions.Item>
            <Descriptions.Item label="Loại bán">
              {(() => {
                const i = saleTypeLabels[viewing.sale_type] || {
                  label: viewing.sale_type,
                  color: 'default',
                };
                return <Tag color={i.color}>{i.label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {viewing.returned ? (
                <Tag color="warning">
                  Đã hoàn hàng{viewing.returned_at ? ` (${formatDate(viewing.returned_at)})` : ''}
                </Tag>
              ) : (() => {
                const info = paymentStatusLabels[viewing.payment_status] || {
                  label: viewing.paid ? 'Đã thanh toán' : 'Chưa thanh toán',
                  color: viewing.paid ? 'success' : 'error',
                };
                return <Tag color={info.color}>{info.label}</Tag>;
              })()}
            </Descriptions.Item>
            {viewing.sale_type === SaleType.BROKER && (
              <Descriptions.Item label="Nhà môi giới" span={3}>
                <span className="font-medium">{viewing.broker_name || '—'}</span>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Địa chỉ" span={2}>
              {viewing.customer_address || '—'}
            </Descriptions.Item>
          </Descriptions>

          <h4 className="mb-2 text-base font-semibold">Danh sách sản phẩm</h4>
          <AppTable
            pagination={false}
            loading={isLoading}
            rowKey={(r: any, i) => `${r.id ?? i}`}
            dataSource={enrichedItems}
            columns={[
              {
                title: 'STT',
                align: 'center' as const,
                width: 60,
                render: (_: any, __: any, i: number) => i + 1,
              },
              {
                title: 'Tên sản phẩm',
                dataIndex: 'product_name',
                key: 'product_name',
                width: '200px',
                sorter: (a: any, b: any) =>
                  (a.product_name || '').localeCompare(b.product_name || '', 'vi'),
              },
              {
                title: 'Kho',
                dataIndex: 'warehouse_name',
                key: 'warehouse_name',
                sorter: (a: any, b: any) =>
                  (a.warehouse_name || '').localeCompare(b.warehouse_name || '', 'vi'),
              },
              { title: 'NCC', dataIndex: 'supplier', key: 'supplier' },
              { title: 'Lô', dataIndex: 'batch', key: 'batch', align: 'center' as const },
              {
                title: 'Đơn vị',
                dataIndex: 'small_unit_label',
                key: 'small_unit_label',
                align: 'center' as const,
              },
              {
                title: 'Số lượng',
                key: 'quantity',
                align: 'right' as const,
                render: (_: any, r: any) =>
                  renderCartonPieces(r.quantity, r.units_per_carton, r.small_unit_label),
              },
              {
                title: 'Đơn giá (vnđ)',
                dataIndex: 'unit_price',
                key: 'unit_price',
                align: 'right' as const,
                render: (v: number) => formatCurrency(v),
              },
              {
                title: 'Thành tiền (vnđ)',
                dataIndex: 'total',
                key: 'total',
                align: 'right' as const,
                sorter: (a: any, b: any) => (Number(a.total) || 0) - (Number(b.total) || 0),
                render: (v: number) => <span className="font-semibold">{formatCurrency(v)}</span>,
              },
            ]}
            summary={() => (
              <AntTable.Summary.Row>
                <AntTable.Summary.Cell index={0} colSpan={8} align="right">
                  <span className="font-bold">Tổng cộng:</span>
                </AntTable.Summary.Cell>
                <AntTable.Summary.Cell index={8} align="right">
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(viewing.total_amount)} vnđ
                  </span>
                </AntTable.Summary.Cell>
              </AntTable.Summary.Row>
            )}
          />
        </div>
      )}
    </AppModal>
  );
};
