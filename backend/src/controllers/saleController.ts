import { Request, Response } from 'express';
import { Op, Transaction, literal } from 'sequelize';
import sequelize from '../models/index';
import { SaleOrder, StockExport, InventoryBalance, Product, Warehouse, SmallUnit } from '../models';
import { sendSuccess, sendPaginated, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

interface ExportPayload {
  product_id: number;
  warehouse_id: number;
  supplier: string;
  batch: string;
  small_unit_id: number;
  quantity: number;
  unit_price: number;
  total?: number;
}

export class SaleController {
  list = async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
    const { keyword, paid, payment_status, saleDate, sale_type, sort_by, sort_order } = req.query as Record<string, string>;

    const where: any = {};
    if (keyword) where[Op.or] = [
      { customer_name: { [Op.like]: `%${keyword}%` } },
      { invoice_code: { [Op.like]: `%${keyword}%` } },
    ];
    if (payment_status) where.payment_status = payment_status;
    else if (paid !== undefined && paid !== '') where.payment_status = paid === 'true' ? 'paid' : 'unpaid';
    if (saleDate) where.sale_date = saleDate;
    if (sale_type) where.sale_type = sale_type;

    const dir = (sort_order || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    let order: any = [['sale_date', 'DESC'], ['created_at', 'DESC']];
    if (sort_by === 'customer_name') {
      order = [['customer_name', dir]];
    } else if (sort_by === 'sale_date') {
      order = [['sale_date', dir], ['created_at', dir]];
    } else if (sort_by === 'total_amount') {
      order = [['total_amount', dir]];
    } else if (sort_by === 'status') {
      order = [[literal("CASE WHEN returned = 1 THEN 3 WHEN payment_status = 'pending' THEN 0 WHEN payment_status = 'paid' THEN 2 ELSE 1 END"), dir]];
    }

    const { count, rows } = await SaleOrder.findAndCountAll({
      where,
      include: [{
        model: StockExport, as: 'items',
        include: [
          { model: Product, as: 'product' },
          { model: Warehouse, as: 'warehouse' },
          { model: SmallUnit, as: 'smallUnit' },
        ],
      }],
      order,
      limit,
      offset: (page - 1) * limit,
    });

    sendPaginated(res, rows.map(formatOrder), page, limit, count);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { customerName, customerPhone, customerAddress, brokerName, saleType, items, paid, paymentStatus, saleDate } = req.body;
    const userId = req.user?.userId || null;

    if (!Array.isArray(items) || items.length === 0) {
      sendError(res, ErrorCode.REQUIRED, 'Hóa đơn phải có ít nhất 1 dòng', 400); return;
    }

    const status = normalizePaymentStatus(paymentStatus, paid);
    const isPending = status === 'pending';

    const totalAmount = (items as ExportPayload[]).reduce(
      (sum, i) => sum + Number(i.total ?? (i.quantity || 0) * (i.unit_price || 0)), 0,
    );

    try {
      const order = await sequelize.transaction(async (t) => {
        await assertStockAvailable(items, t);

        const invoiceCode = await generateInvoiceCode(t);
        const o = await SaleOrder.create({
          invoice_code: invoiceCode,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          broker_name: saleType === 'broker' ? (brokerName || null) : null,
          sale_type: saleType,
          total_amount: totalAmount,
          paid: status === 'paid',
          payment_status: status,
          sale_date: saleDate || new Date(),
          created_by_user_id: userId,
        }, { transaction: t });

        await StockExport.bulkCreate(
          (items as ExportPayload[]).map(i => ({
            sale_order_id: o.id,
            product_id: i.product_id,
            warehouse_id: i.warehouse_id,
            supplier: i.supplier,
            batch: i.batch,
            small_unit_id: i.small_unit_id,
            quantity: Number(i.quantity || 0),
            unit_price: Number(i.unit_price || 0),
            total: Number(i.total ?? (i.quantity || 0) * (i.unit_price || 0)),
            is_pending: isPending,
          })),
          { transaction: t },
        );

        return o;
      });

      const refreshed = await fetchOrder(order.id);
      sendSuccess(res, formatOrder(refreshed!), 'Tạo hóa đơn thành công', 201);
    } catch (err) {
      if (err instanceof BusinessError) {
        sendError(res, err.errorCode, err.message, err.status); return;
      }
      throw err;
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { customerName, customerPhone, customerAddress, brokerName, saleType, items, paid, paymentStatus, saleDate } = req.body;

    const order = await SaleOrder.findByPk(id, { include: [{ model: StockExport, as: 'items' }] });
    if (!order) { sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy hóa đơn', 404); return; }
    if (order.returned) {
      sendError(res, ErrorCode.FORBIDDEN_RESOURCE, 'Không thể chỉnh sửa hóa đơn đã hoàn hàng', 400);
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      sendError(res, ErrorCode.REQUIRED, 'Hóa đơn phải có ít nhất 1 dòng', 400); return;
    }

    const status = normalizePaymentStatus(paymentStatus, paid, order.payment_status);
    const isPending = status === 'pending';

    const totalAmount = (items as ExportPayload[]).reduce(
      (sum, i) => sum + Number(i.total ?? (i.quantity || 0) * (i.unit_price || 0)), 0,
    );

    try {
      await sequelize.transaction(async (t) => {
        // Trừ items cũ khỏi balance (trigger DELETE chỉ chạy khi is_pending=0).
        // Đồng thời clear pending reservation của đơn này khỏi assertStockAvailable kế tiếp.
        await StockExport.destroy({ where: { sale_order_id: id }, transaction: t });
        await assertStockAvailable(items, t);

        await order.update({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          broker_name: saleType === 'broker' ? (brokerName || null) : null,
          sale_type: saleType,
          total_amount: totalAmount,
          paid: status === 'paid',
          payment_status: status,
          sale_date: saleDate,
        }, { transaction: t });

        await StockExport.bulkCreate(
          (items as ExportPayload[]).map(i => ({
            sale_order_id: Number(id),
            product_id: i.product_id,
            warehouse_id: i.warehouse_id,
            supplier: i.supplier,
            batch: i.batch,
            small_unit_id: i.small_unit_id,
            quantity: Number(i.quantity || 0),
            unit_price: Number(i.unit_price || 0),
            total: Number(i.total ?? (i.quantity || 0) * (i.unit_price || 0)),
            is_pending: isPending,
          })),
          { transaction: t },
        );
      });

      const refreshed = await fetchOrder(Number(id));
      sendSuccess(res, formatOrder(refreshed!), 'Cập nhật hóa đơn thành công');
    } catch (err) {
      if (err instanceof BusinessError) {
        sendError(res, err.errorCode, err.message, err.status); return;
      }
      throw err;
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const order = await SaleOrder.findByPk(req.params.id);
    if (!order) { sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy hóa đơn', 404); return; }

    // MySQL không kích hoạt row-level trigger khi xóa qua FK CASCADE.
    // Phải xóa stock_exports thủ công để trigger trg_se_after_delete cộng trả tồn,
    // sau đó mới destroy sale_order. Nếu đơn đã hoàn hàng thì không còn stock_exports
    // nào để xóa, destroy chỉ còn xóa header.
    await sequelize.transaction(async (t) => {
      await StockExport.destroy({ where: { sale_order_id: order.id }, transaction: t });
      await order.destroy({ transaction: t });
    });
    sendSuccess(res, null, 'Xóa hóa đơn thành công');
  };

  confirmShipment = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { paymentStatus } = req.body as { paymentStatus?: string };
    const nextStatus = paymentStatus === 'paid' ? 'paid' : 'unpaid';

    const order = await SaleOrder.findByPk(id, { include: [{ model: StockExport, as: 'items' }] });
    if (!order) { sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy hóa đơn', 404); return; }
    if (order.returned) {
      sendError(res, ErrorCode.FORBIDDEN_RESOURCE, 'Đơn đã hoàn hàng', 400); return;
    }
    if (order.payment_status !== 'pending') {
      sendError(res, ErrorCode.FORBIDDEN_RESOURCE, 'Đơn không ở trạng thái Chờ xuất hàng', 400); return;
    }

    const items = (order.items as any[] | undefined) || [];
    if (items.length === 0) {
      sendError(res, ErrorCode.REQUIRED, 'Đơn không có dòng nào', 400); return;
    }

    try {
      await sequelize.transaction(async (t) => {
        // Items hiện đang is_pending=1 — destroy không trừ kho (trigger skip)
        await StockExport.destroy({ where: { sale_order_id: order.id }, transaction: t });
        await assertStockAvailable(items as ExportPayload[], t);

        await order.update({
          paid: nextStatus === 'paid',
          payment_status: nextStatus,
        }, { transaction: t });

        await StockExport.bulkCreate(
          items.map((i: any) => ({
            sale_order_id: order.id,
            product_id: i.product_id,
            warehouse_id: i.warehouse_id,
            supplier: i.supplier,
            batch: i.batch,
            small_unit_id: i.small_unit_id,
            quantity: Number(i.quantity || 0),
            unit_price: Number(i.unit_price || 0),
            total: Number(i.total || 0),
            is_pending: false,
          })),
          { transaction: t },
        );
      });

      const refreshed = await fetchOrder(order.id);
      sendSuccess(res, formatOrder(refreshed!), 'Xác nhận xuất hàng thành công');
    } catch (err) {
      if (err instanceof BusinessError) {
        sendError(res, err.errorCode, err.message, err.status); return;
      }
      throw err;
    }
  };

  returnOrder = async (req: Request, res: Response): Promise<void> => {
    const order = await SaleOrder.findByPk(req.params.id);
    if (!order) { sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy hóa đơn', 404); return; }
    if (order.returned) {
      sendError(res, ErrorCode.FORBIDDEN_RESOURCE, 'Hóa đơn đã được hoàn hàng', 400); return;
    }

    await sequelize.transaction(async (t) => {
      // Xóa stock_exports thủ công để trigger trg_se_after_delete cộng trả tồn.
      await StockExport.destroy({ where: { sale_order_id: order.id }, transaction: t });
      await order.update({ returned: true, returned_at: new Date() }, { transaction: t });
    });

    const refreshed = await fetchOrder(order.id);
    sendSuccess(res, formatOrder(refreshed!), 'Hoàn hàng thành công');
  };
}

function normalizePaymentStatus(
  paymentStatus: unknown,
  paid: unknown,
  fallback: 'paid' | 'unpaid' | 'pending' = 'unpaid',
): 'paid' | 'unpaid' | 'pending' {
  if (paymentStatus === 'paid' || paymentStatus === 'unpaid' || paymentStatus === 'pending') {
    return paymentStatus;
  }
  if (paid === true || paid === 'true' || paid === 1) return 'paid';
  if (paid === false || paid === 'false' || paid === 0) return 'unpaid';
  return fallback;
}

class BusinessError extends Error {
  constructor(public errorCode: number, public status: number, message: string) { super(message); }
}

async function assertStockAvailable(items: ExportPayload[], t: Transaction): Promise<void> {
  // Gộp request theo (product, warehouse, supplier, batch) để check tổng cần
  const grouped = new Map<string, number>();
  for (const i of items) {
    const key = `${i.product_id}|${i.warehouse_id}|${i.supplier}|${i.batch}`;
    grouped.set(key, (grouped.get(key) || 0) + Number(i.quantity || 0));
  }

  for (const [key, needed] of grouped.entries()) {
    const [product_id, warehouse_id, supplier, batch] = key.split('|');
    const balance = await InventoryBalance.findOne({
      where: {
        product_id: Number(product_id),
        warehouse_id: Number(warehouse_id),
        supplier, batch,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    const raw = balance?.stock_pieces || 0;
    const pendingSum = (await StockExport.sum('quantity', {
      where: {
        is_pending: true,
        product_id: Number(product_id),
        warehouse_id: Number(warehouse_id),
        supplier, batch,
      },
      transaction: t,
    })) || 0;
    const available = raw - pendingSum;
    if (available < needed) {
      throw new BusinessError(
        ErrorCode.EMPTY, 400,
        `Tồn không đủ cho lô "${batch}" (NCC ${supplier}): khả dụng ${available} (tồn ${raw} - đang chờ xuất ${pendingSum}), cần ${needed}`,
      );
    }
  }
}

async function generateInvoiceCode(t: Transaction): Promise<string> {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const prefix = `HD-${dateStr}-`;

  const latest = await SaleOrder.findOne({
    where: { invoice_code: { [Op.like]: `${prefix}%` } },
    order: [['invoice_code', 'DESC']],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  const nextSeq = latest ? Number(latest.invoice_code.split('-')[2]) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

async function fetchOrder(id: number) {
  return SaleOrder.findByPk(id, {
    include: [{
      model: StockExport, as: 'items',
      include: [
        { model: Product, as: 'product' },
        { model: Warehouse, as: 'warehouse' },
        { model: SmallUnit, as: 'smallUnit' },
      ],
    }],
  });
}

function formatOrder(o: any) {
  const json = o.toJSON ? o.toJSON() : o;
  return {
    id: json.id, key: String(json.id),
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
    items: (json.items || []).map((i: any) => ({
      id: i.id,
      product_id: i.product_id,
      product_name: i.product?.name || null,
      warehouse_id: i.warehouse_id,
      warehouse_name: i.warehouse?.name || null,
      supplier: i.supplier,
      batch: i.batch,
      small_unit_id: i.small_unit_id,
      small_unit: i.smallUnit ? { id: i.smallUnit.id, code: i.smallUnit.code, label: i.smallUnit.label } : null,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      total: Number(i.total),
    })),
    created_at: json.created_at,
    updated_at: json.updated_at,
  };
}
