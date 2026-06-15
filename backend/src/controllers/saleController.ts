import { Request, Response } from 'express';
import { Op, literal } from 'sequelize';
import sequelize from '../models/index';
import { Product, SaleOrder, SmallUnit, StockExport, Warehouse } from '../models';
import {
  BusinessError,
  createSaleOrder,
  deleteSaleOrder,
  confirmShipment,
  fetchOrder,
  formatOrder,
  formatOrderDetail,
  formatOrderSummary,
  returnSaleOrder,
  updateSaleOrder,
} from '../services/saleOrderService';
import { ErrorCode } from '../utils/errorCodes';
import { sendError, sendPaginated, sendSuccess } from '../utils/responseHelper';

const SORT_STATUS_ORDER =
  "CASE WHEN returned = 1 THEN 4 WHEN payment_status = 'pending' THEN 0 WHEN payment_status = 'unpaid' THEN 1 WHEN payment_status = 'paid' THEN 2 WHEN payment_status = 'cancelled' THEN 3 ELSE 5 END";

export class SaleController {
  list = async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
    const {
      keyword,
      productKeyword,
      paid,
      payment_status,
      saleDate,
      sale_type,
      sort_by,
      sort_order,
      include_items,
    } = req.query as Record<string, string>;
    const includeItems = include_items === 'true';

    const where: any = {};
    if (keyword) {
      where[Op.or] = [
        { customer_name: { [Op.like]: `%${keyword}%` } },
        { invoice_code: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (productKeyword) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        literal(`EXISTS (
          SELECT 1
          FROM stock_exports se_filter
          INNER JOIN products p_filter ON p_filter.id = se_filter.product_id
          WHERE se_filter.sale_order_id = SaleOrder.id
            AND p_filter.name LIKE ${sequelize.escape(`%${productKeyword}%`)}
        )`),
      ];
    }
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
      order = [[literal(SORT_STATUS_ORDER), dir]];
    }

    const { count, rows } = await SaleOrder.findAndCountAll({
      where,
      attributes: {
        include: [
          [literal('(SELECT COUNT(*) FROM stock_exports WHERE sale_order_id = `SaleOrder`.`id`)'), 'items_count'],
        ],
      },
      include: includeItems
        ? [
            {
              model: StockExport,
              as: 'items',
              include: [
                { model: Product, as: 'product' },
                { model: Warehouse, as: 'warehouse' },
                { model: SmallUnit, as: 'smallUnit' },
              ],
            },
          ]
        : [],
      order,
      limit,
      offset: (page - 1) * limit,
      distinct: includeItems,
    });

    sendPaginated(res, rows.map(includeItems ? formatOrderDetail : formatOrderSummary), page, limit, count);
  };

  getDetail = async (req: Request, res: Response): Promise<void> => {
    const order = await fetchOrder(Number(req.params.id));
    if (!order) {
      sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy hóa đơn', 404);
      return;
    }
    sendSuccess(res, formatOrderDetail(order));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { customerName, customerPhone, customerAddress, brokerName, saleType, items, paid, paymentStatus, saleDate } = req.body;
    const userId = (req as any).user?.userId || null;

    if (!Array.isArray(items) || items.length === 0) {
      sendError(res, ErrorCode.REQUIRED, 'Hóa đơn phải có ít nhất 1 dòng', 400);
      return;
    }

    try {
      const order = await createSaleOrder({
        customerName,
        customerPhone,
        customerAddress,
        brokerName,
        saleType,
        items,
        paid,
        paymentStatus,
        saleDate,
        userId,
      });

      sendSuccess(res, formatOrder(order!), 'Tạo hóa đơn thành công', 201);
    } catch (err) {
      if (err instanceof BusinessError) {
        sendError(res, err.errorCode, err.message, err.status);
        return;
      }
      throw err;
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { customerName, customerPhone, customerAddress, brokerName, saleType, items, paid, paymentStatus, saleDate } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      sendError(res, ErrorCode.REQUIRED, 'Hóa đơn phải có ít nhất 1 dòng', 400);
      return;
    }

    try {
      const order = await updateSaleOrder(Number(id), {
        customerName,
        customerPhone,
        customerAddress,
        brokerName,
        saleType,
        items,
        paid,
        paymentStatus,
        saleDate,
      });

      if (!order) {
        sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy hóa đơn', 404);
        return;
      }

      sendSuccess(res, formatOrder(order), 'Cập nhật hóa đơn thành công');
    } catch (err) {
      if (err instanceof BusinessError) {
        sendError(res, err.errorCode, err.message, err.status);
        return;
      }
      throw err;
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      const removed = await deleteSaleOrder(Number(req.params.id));
      if (!removed) {
        sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy hóa đơn', 404);
        return;
      }
      sendSuccess(res, null, 'Xóa hóa đơn thành công');
    } catch (err) {
      if (err instanceof BusinessError) {
        sendError(res, err.errorCode, err.message, err.status);
        return;
      }
      throw err;
    }
  };

  confirmShipment = async (req: Request, res: Response): Promise<void> => {
    try {
      const order = await confirmShipment(Number(req.params.id), req.body?.paymentStatus);
      if (!order) {
        sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy hóa đơn', 404);
        return;
      }
      sendSuccess(res, formatOrder(order), 'Xác nhận xuất hàng thành công');
    } catch (err) {
      if (err instanceof BusinessError) {
        sendError(res, err.errorCode, err.message, err.status);
        return;
      }
      throw err;
    }
  };

  returnOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const order = await returnSaleOrder(Number(req.params.id));
      if (!order) {
        sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy hóa đơn', 404);
        return;
      }
      sendSuccess(res, formatOrder(order), 'Hoàn hàng thành công');
    } catch (err) {
      if (err instanceof BusinessError) {
        sendError(res, err.errorCode, err.message, err.status);
        return;
      }
      throw err;
    }
  };
}
