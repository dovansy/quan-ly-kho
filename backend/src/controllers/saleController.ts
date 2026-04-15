import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../models/index';
import { Sale, SaleItem } from '../models';
import { sendSuccess, sendPaginated, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

export class SaleController {
  getSales = async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
    const { keyword, paid, saleDate } = req.query as Record<string, string>;

    const where: any = {};
    if (keyword) where[Op.or] = [
      { customer_name: { [Op.like]: `%${keyword}%` } },
      { invoice_code: { [Op.like]: `%${keyword}%` } },
    ];
    if (paid !== undefined && paid !== '') where.paid = paid === 'true';
    if (saleDate) where.sale_date = saleDate;

    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [{ model: SaleItem, as: 'items' }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    const result = rows.map(s => formatSale(s));
    sendPaginated(res, result, page, limit, count);
  };

  createSale = async (req: Request, res: Response): Promise<void> => {
    const { customerName, customerPhone, saleType, items, paid, saleDate, createdBy } = req.body;

    // Auto-generate invoice code
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const cnt = await Sale.count({ where: { invoice_code: { [Op.like]: `HD-${dateStr}-%` } } });
    const invoiceCode = `HD-${dateStr}-${String(cnt + 1).padStart(3, '0')}`;

    const totalAmount = (items || [])
      .reduce((sum: number, i: any) => sum + (i.total || i.quantity * i.unitPrice), 0);

    const sale = await sequelize.transaction(async (t) => {
      const s = await Sale.create({
        invoice_code: invoiceCode, customer_name: customerName, customer_phone: customerPhone,
        sale_type: saleType, total_amount: totalAmount, paid: !!paid, sale_date: saleDate || now,
        created_by: createdBy,
      }, { transaction: t });

      if (items?.length) {
        await SaleItem.bulkCreate(
          items.map((i: any) => ({
            sale_id: s.id, product_name: i.productName, quantity: i.quantity,
            unit: i.unit, unit_price: i.unitPrice || 0,
            total: i.total || i.quantity * i.unitPrice,
          })),
          { transaction: t },
        );
      }
      return s;
    });

    const result = await Sale.findByPk(sale.id, { include: [{ model: SaleItem, as: 'items' }] });
    sendSuccess(res, formatSale(result!), 'Sale created successfully', 201);
  };

  updateSale = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { customerName, customerPhone, saleType, items, paid, saleDate, createdBy } = req.body;

    const sale = await Sale.findByPk(id);
    if (!sale) { sendError(res, ErrorCode.NOT_FOUND, 'Sale not found', 404); return; }

    const totalAmount = (items || [])
      .reduce((sum: number, i: any) => sum + (i.total || i.quantity * i.unitPrice), 0);

    await sequelize.transaction(async (t) => {
      await sale.update({
        customer_name: customerName, customer_phone: customerPhone, sale_type: saleType,
        total_amount: totalAmount, paid: !!paid, sale_date: saleDate, created_by: createdBy,
      }, { transaction: t });

      await SaleItem.destroy({ where: { sale_id: id }, transaction: t });
      if (items?.length) {
        await SaleItem.bulkCreate(
          items.map((i: any) => ({
            sale_id: id, product_name: i.productName, quantity: i.quantity,
            unit: i.unit, unit_price: i.unitPrice || 0,
            total: i.total || i.quantity * i.unitPrice,
          })),
          { transaction: t },
        );
      }
    });

    const result = await Sale.findByPk(id, { include: [{ model: SaleItem, as: 'items' }] });
    sendSuccess(res, formatSale(result!), 'Sale updated successfully');
  };

  deleteSale = async (req: Request, res: Response): Promise<void> => {
    const deleted = await Sale.destroy({ where: { id: req.params.id } });
    if (!deleted) { sendError(res, ErrorCode.NOT_FOUND, 'Sale not found', 404); return; }
    sendSuccess(res, null, 'Sale deleted successfully');
  };
}

// ── helper ────────────────────────────────────────────────
function formatSale(s: Sale) {
  return {
    ...s.toJSON(),
    key: String(s.id),
    paid: Boolean(s.paid),
    items: (s.items || []).map((i: any) => ({
      id: i.id, productName: i.product_name, quantity: i.quantity,
      unit: i.unit, unitPrice: Number(i.unit_price), total: Number(i.total),
    })),
  };
}
