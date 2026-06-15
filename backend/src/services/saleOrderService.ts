import { Op, Transaction, literal } from 'sequelize';
import sequelize from '../models/index';
import { InventoryBalance, Product, SaleOrder, SmallUnit, StockExport, Warehouse } from '../models';
import { ErrorCode } from '../utils/errorCodes';

export interface ExportPayload {
  product_id: number;
  warehouse_id: number;
  supplier: string;
  batch: string;
  small_unit_id: number;
  quantity: number;
  unit_price: number;
  total?: number;
}

export class BusinessError extends Error {
  constructor(public errorCode: number, public status: number, message: string) {
    super(message);
  }
}

export function normalizePaymentStatus(
  paymentStatus: unknown,
  paid: unknown,
  fallback: 'paid' | 'unpaid' | 'pending' | 'cancelled' = 'unpaid',
): 'paid' | 'unpaid' | 'pending' | 'cancelled' {
  if (
    paymentStatus === 'paid' ||
    paymentStatus === 'unpaid' ||
    paymentStatus === 'pending' ||
    paymentStatus === 'cancelled'
  ) {
    return paymentStatus;
  }
  if (paid === true || paid === 'true' || paid === 1) return 'paid';
  if (paid === false || paid === 'false' || paid === 0) return 'unpaid';
  return fallback;
}

export async function createSaleOrder(params: {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  brokerName?: string;
  saleType: string;
  items: ExportPayload[];
  paid?: unknown;
  paymentStatus?: unknown;
  saleDate?: string | Date;
  userId?: number | null;
}) {
  const {
    customerName,
    customerPhone,
    customerAddress,
    brokerName,
    saleType,
    items,
    paid,
    paymentStatus,
    saleDate,
    userId = null,
  } = params;

  const status = normalizePaymentStatus(paymentStatus, paid);
  if (status === 'cancelled') {
    throw new BusinessError(
      ErrorCode.FORBIDDEN_RESOURCE,
      400,
      'Không thể tạo mới hóa đơn ở trạng thái Huỷ đơn',
    );
  }
  const isPending = status === 'pending';
  const totalAmount = computeTotalAmount(items);

  const order = await sequelize.transaction(async (t) => {
    await assertStockAvailable(items, t);

    const invoiceCode = await generateInvoiceCode(t);
    const createdPayload: any = {
      invoice_code: invoiceCode,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      customer_address: customerAddress || null,
      broker_name: saleType === 'broker' ? (brokerName || null) : null,
      sale_type: saleType as 'wholesale' | 'retail' | 'broker',
      total_amount: totalAmount,
      paid: status === 'paid',
      payment_status: status,
      sale_date: normalizeSaleDate(saleDate) || new Date(),
      created_by_user_id: userId,
    };
    const created = await SaleOrder.create(createdPayload, { transaction: t });

    await replaceOrderItems(created.id, items, isPending, t);
    return created;
  });

  return fetchOrder(order.id);
}

export async function updateSaleOrder(
  id: number,
  params: {
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    brokerName?: string;
    saleType?: string;
    items: ExportPayload[];
    paid?: unknown;
    paymentStatus?: unknown;
    saleDate?: string | Date;
  },
) {
  const order = await SaleOrder.findByPk(id, { include: [{ model: StockExport, as: 'items' }] });
  if (!order) return null;

  const {
    customerName,
    customerPhone,
    customerAddress,
    brokerName,
    saleType,
    items,
    paid,
    paymentStatus,
    saleDate,
  } = params;
  const wasReturned = order.returned;
  const status = normalizePaymentStatus(paymentStatus, paid, order.payment_status);
  if (status === 'cancelled' && order.payment_status !== 'pending') {
    throw new BusinessError(
      ErrorCode.FORBIDDEN_RESOURCE,
      400,
      'Chỉ đơn ở trạng thái Chờ xuất hàng mới được hủy',
    );
  }
  const isPending = status === 'pending';
  const totalAmount = computeTotalAmount(items);

  await sequelize.transaction(async (t) => {
    if (status === 'cancelled') {
      const snapshotSource = await fetchOrder(order.id, t);
      const snapshot = snapshotSource ? formatOrderDetail(snapshotSource).items : [];
      const snapshotTotal = snapshot.reduce(
        (sum: number, item: any) =>
          sum + Number(item.total ?? (item.quantity || 0) * (item.unit_price || 0)),
        0,
      );

      const cancelledPayload: any = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        broker_name: saleType === 'broker' ? (brokerName || null) : null,
        sale_type: saleType as 'wholesale' | 'retail' | 'broker',
        total_amount: snapshotTotal,
        paid: false,
        payment_status: 'cancelled',
        sale_date: normalizeSaleDate(saleDate),
        returned: false,
        returned_at: null,
        items_snapshot: snapshot,
      };

      await order.update(cancelledPayload, { transaction: t });

      await StockExport.destroy({ where: { sale_order_id: id }, transaction: t });
      return;
    }

    await StockExport.destroy({ where: { sale_order_id: id }, transaction: t });
    await assertStockAvailable(items, t);

    const updatePayload: any = {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      broker_name: saleType === 'broker' ? (brokerName || null) : null,
      sale_type: saleType as 'wholesale' | 'retail' | 'broker',
      total_amount: totalAmount,
      paid: status === 'paid',
      payment_status: status,
      sale_date: normalizeSaleDate(saleDate),
      ...(wasReturned ? { returned: false, returned_at: null, items_snapshot: null } : {}),
    };

    await order.update(updatePayload, { transaction: t });

    await replaceOrderItems(id, items, isPending, t);
  });

  return fetchOrder(id);
}

export async function deleteSaleOrder(id: number) {
  const order = await SaleOrder.findByPk(id);
  if (!order) return null;
  if (order.payment_status !== 'pending' && order.payment_status !== 'cancelled') {
    throw new BusinessError(
      ErrorCode.FORBIDDEN_RESOURCE,
      400,
      'Chỉ được xóa đơn ở trạng thái Chờ xuất hàng hoặc Huỷ đơn',
    );
  }

  await sequelize.transaction(async (t) => {
    await StockExport.destroy({ where: { sale_order_id: order.id }, transaction: t });
    await order.destroy({ transaction: t });
  });

  return true;
}

export async function confirmShipment(id: number, paymentStatus?: string) {
  const nextStatus = paymentStatus === 'paid' ? 'paid' : 'unpaid';
  const order = await SaleOrder.findByPk(id, { include: [{ model: StockExport, as: 'items' }] });
  if (!order) return null;
  if (order.returned) {
    throw new BusinessError(ErrorCode.FORBIDDEN_RESOURCE, 400, 'Đơn đã hoàn hàng');
  }
  if (order.payment_status !== 'pending') {
    throw new BusinessError(
      ErrorCode.FORBIDDEN_RESOURCE,
      400,
      'Đơn không ở trạng thái Chờ xuất hàng',
    );
  }

  const items = (order.items as any[] | undefined) || [];
  if (items.length === 0) {
    throw new BusinessError(ErrorCode.REQUIRED, 400, 'Đơn không có dòng nào');
  }

  await sequelize.transaction(async (t) => {
    await StockExport.destroy({ where: { sale_order_id: order.id }, transaction: t });
    await assertStockAvailable(items as ExportPayload[], t);

    await order.update(
      {
        paid: nextStatus === 'paid',
        payment_status: nextStatus,
      },
      { transaction: t },
    );

    await StockExport.bulkCreate(
      items.map((item: any) => ({
        sale_order_id: order.id,
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
        supplier: item.supplier,
        batch: item.batch,
        small_unit_id: item.small_unit_id,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        total: Number(item.total || 0),
        is_pending: false,
      })),
      { transaction: t },
    );
  });

  return fetchOrder(order.id);
}

export async function returnSaleOrder(id: number) {
  const order = await fetchOrder(id);
  if (!order) return null;
  if (order.returned) {
    throw new BusinessError(ErrorCode.FORBIDDEN_RESOURCE, 400, 'Hóa đơn đã được hoàn hàng');
  }

  const snapshot = formatOrderDetail(order).items;

  await sequelize.transaction(async (t) => {
    await order.update(
      { items_snapshot: snapshot, returned: true, returned_at: new Date() },
      { transaction: t },
    );
    await StockExport.destroy({ where: { sale_order_id: order.id }, transaction: t });
  });

  return fetchOrder(order.id);
}

export async function fetchOrder(id: number, transaction?: Transaction) {
  return SaleOrder.findByPk(id, {
    transaction,
    include: [
      {
        model: StockExport,
        as: 'items',
        attributes: {
          include: [
            [
              literal(`(
            SELECT units_per_carton FROM stock_imports
            WHERE product_id = \`items\`.\`product_id\`
              AND supplier = \`items\`.\`supplier\`
              AND batch = \`items\`.\`batch\`
            ORDER BY (warehouse_id = \`items\`.\`warehouse_id\`) DESC,
                     import_date DESC, id DESC
            LIMIT 1
          )`),
              'units_per_carton',
            ],
          ],
        },
        include: [
          { model: Product, as: 'product' },
          { model: Warehouse, as: 'warehouse' },
          { model: SmallUnit, as: 'smallUnit' },
        ],
      },
    ],
  });
}

export function formatOrderSummary(order: any) {
  const json = order.toJSON ? order.toJSON() : order;
  const fallbackItemsCount =
    Number(json.items_count) ||
    ((json.payment_status === 'cancelled' || json.returned) && Array.isArray(json.items_snapshot)
      ? json.items_snapshot.length
      : 0);
  return { ...baseOrderFields(json), items_count: fallbackItemsCount };
}

export function formatOrderDetail(order: any) {
  const json = order.toJSON ? order.toJSON() : order;
  const liveItems = (json.items || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product?.name || null,
    warehouse_id: item.warehouse_id,
    warehouse_name: item.warehouse?.name || null,
    supplier: item.supplier,
    batch: item.batch,
    small_unit_id: item.small_unit_id,
    small_unit: item.smallUnit
      ? { id: item.smallUnit.id, code: item.smallUnit.code, label: item.smallUnit.label }
      : null,
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unit_price),
    total: Number(item.total),
    units_per_carton: item.units_per_carton != null ? Number(item.units_per_carton) : 0,
  }));

  const items =
    liveItems.length === 0 &&
    (json.returned || json.payment_status === 'cancelled') &&
    Array.isArray(json.items_snapshot)
      ? json.items_snapshot
      : liveItems;

  return { ...baseOrderFields(json), items, items_count: items.length };
}

export const formatOrder = formatOrderDetail;

function baseOrderFields(json: any) {
  return {
    id: json.id,
    key: String(json.id),
    invoice_code: json.invoice_code,
    customer_name: json.customer_name,
    customer_phone: json.customer_phone,
    customer_address: json.customer_address,
    broker_name: json.broker_name || null,
    sale_type: json.sale_type,
    total_amount: Number(json.total_amount),
    paid: Boolean(json.paid),
    payment_status: json.payment_status || (json.paid ? 'paid' : 'unpaid'),
    sale_date: json.sale_date,
    returned: Boolean(json.returned),
    returned_at: json.returned_at || null,
    created_at: json.created_at,
    updated_at: json.updated_at,
  };
}

function computeTotalAmount(items: ExportPayload[]) {
  return items.reduce(
    (sum, item) => sum + Number(item.total ?? (item.quantity || 0) * (item.unit_price || 0)),
    0,
  );
}

async function replaceOrderItems(
  orderId: number,
  items: ExportPayload[],
  isPending: boolean,
  transaction: Transaction,
) {
  await StockExport.bulkCreate(
    items.map((item) => ({
      sale_order_id: orderId,
      product_id: item.product_id,
      warehouse_id: item.warehouse_id,
      supplier: item.supplier,
      batch: item.batch,
      small_unit_id: item.small_unit_id,
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || 0),
      total: Number(item.total ?? (item.quantity || 0) * (item.unit_price || 0)),
      is_pending: isPending,
    })),
    { transaction },
  );
}

async function assertStockAvailable(items: ExportPayload[], transaction: Transaction): Promise<void> {
  const grouped = new Map<string, number>();
  for (const item of items) {
    const key = `${item.product_id}|${item.warehouse_id}|${item.supplier}|${item.batch}`;
    grouped.set(key, (grouped.get(key) || 0) + Number(item.quantity || 0));
  }

  for (const [key, needed] of grouped.entries()) {
    const [product_id, warehouse_id, supplier, batch] = key.split('|');
    const balance = await InventoryBalance.findOne({
      where: {
        product_id: Number(product_id),
        warehouse_id: Number(warehouse_id),
        supplier,
        batch,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!balance) {
      throw new BusinessError(
        ErrorCode.EMPTY,
        400,
        `Lô "${batch}" (NCC ${supplier}) không còn tồn trong kho.`,
      );
    }

    const raw = balance.stock_pieces || 0;
    const pendingSum =
      (await StockExport.sum('quantity', {
        where: {
          is_pending: true,
          product_id: Number(product_id),
          warehouse_id: Number(warehouse_id),
          supplier,
          batch,
        },
        transaction,
      })) || 0;
    const available = raw - pendingSum;
    if (available < needed) {
      throw new BusinessError(
        ErrorCode.EMPTY,
        400,
        `Tồn lô "${batch}" không đủ: còn ${available}, cần ${needed}.`,
      );
    }
  }
}

async function generateInvoiceCode(transaction: Transaction): Promise<string> {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const prefix = `HD-${dateStr}-`;

  const latest = await SaleOrder.findOne({
    where: { invoice_code: { [Op.like]: `${prefix}%` } },
    order: [['invoice_code', 'DESC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const nextSeq = latest ? Number(latest.invoice_code.split('-')[2]) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

function normalizeSaleDate(value?: string | Date) {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  return value;
}
