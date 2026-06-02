import { Request, Response } from 'express';
import { Op, literal } from 'sequelize';
import { Product, SaleOrder, SmallUnit, StockExport, Warehouse } from '../models';
import { sendSuccess } from '../utils/responseHelper';

export class SalesReportController {
  list = async (req: Request, res: Response): Promise<void> => {
    const { brokerName, fromDate, toDate, payment_status } = req.query as Record<string, string>;
    const where: any = {
      sale_type: { [Op.in]: ['retail', 'broker'] },
      returned: false,
    };

    if (brokerName) {
      where[Op.or] = [
        { sale_type: 'broker', broker_name: { [Op.like]: `%${brokerName}%` } },
        { sale_type: 'retail', customer_name: { [Op.like]: `%${brokerName}%` } },
      ];
    }
    if (fromDate || toDate) {
      where.sale_date = {
        ...(fromDate ? { [Op.gte]: fromDate } : {}),
        ...(toDate ? { [Op.lte]: toDate } : {}),
      };
    }
    if (payment_status) where.payment_status = payment_status;

    const rows = await SaleOrder.findAll({
      where,
      include: [{
        model: StockExport,
        as: 'items',
        attributes: {
          include: [
            [literal(`(
              SELECT units_per_carton FROM stock_imports
              WHERE product_id = \`items\`.\`product_id\`
                AND supplier = \`items\`.\`supplier\`
                AND batch = \`items\`.\`batch\`
              ORDER BY (warehouse_id = \`items\`.\`warehouse_id\`) DESC,
                       import_date DESC, id DESC
              LIMIT 1
            )`), 'units_per_carton'],
          ],
        },
        include: [
          { model: Product, as: 'product' },
          { model: Warehouse, as: 'warehouse' },
          { model: SmallUnit, as: 'smallUnit' },
        ],
      }],
      order: [['sale_date', 'DESC'], ['created_at', 'DESC']],
    });

    sendSuccess(res, rows.map(formatReportOrder));
  };

  brokers = async (_req: Request, res: Response): Promise<void> => {
    const rows = await SaleOrder.findAll({
      where: {
        sale_type: { [Op.in]: ['retail', 'broker'] },
        returned: false,
        [Op.or]: [
          { broker_name: { [Op.ne]: null } },
          { customer_name: { [Op.ne]: null } },
        ],
      },
      attributes: ['sale_type', 'broker_name', 'customer_name'],
      order: [['customer_name', 'ASC'], ['broker_name', 'ASC']],
      raw: true,
    });

    const optionMap = new Map<string, { label: string; value: string }>();
    rows.forEach((row: any) => {
      const rawName = row.sale_type === 'retail' ? row.customer_name : row.broker_name;
      const name = String(rawName || '').trim();
      if (!name) return;
      const key = `${row.sale_type}:${name.toLocaleLowerCase('vi')}`;
      if (!optionMap.has(key)) {
        optionMap.set(key, {
          label: row.sale_type === 'retail' ? `${name} (Bán lẻ)` : `${name} (Nhà môi giới)`,
          value: name,
        });
      }
    });

    const options = Array.from(optionMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, 'vi')
    );

    sendSuccess(res, options);
  };
}

function formatReportOrder(order: any) {
  const json = order.toJSON ? order.toJSON() : order;
  const items = (json.items || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product?.name || '',
    warehouse_id: item.warehouse_id,
    warehouse_name: item.warehouse?.name || '',
    supplier: item.supplier,
    batch: item.batch,
    small_unit_id: item.small_unit_id,
    small_unit: item.smallUnit
      ? { id: item.smallUnit.id, code: item.smallUnit.code, label: item.smallUnit.label }
      : null,
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unit_price) || 0,
    total: Number(item.total) || 0,
    units_per_carton: item.units_per_carton != null ? Number(item.units_per_carton) : 0,
  }));

  return {
    id: json.id,
    key: String(json.id),
    invoice_code: json.invoice_code,
    customer_name: json.customer_name,
    customer_phone: json.customer_phone,
    customer_address: json.customer_address,
    broker_name: json.broker_name || null,
    sale_type: json.sale_type,
    items,
    items_count: items.length,
    total_amount: Number(json.total_amount) || 0,
    paid: Boolean(json.paid),
    payment_status: json.payment_status || (json.paid ? 'paid' : 'unpaid'),
    sale_date: json.sale_date,
    returned: Boolean(json.returned),
    returned_at: json.returned_at || null,
    created_at: json.created_at,
    updated_at: json.updated_at,
  };
}
