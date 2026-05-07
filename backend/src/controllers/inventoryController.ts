import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { InventoryBalance, Product, Warehouse, SmallUnit } from '../models';
import { sendSuccess } from '../utils/responseHelper';

export class InventoryController {
  /**
   * GET /inventory — đọc trực tiếp từ inventory_balance (maintained bởi trigger).
   * Default: chỉ trả về dòng có stock_pieces > 0.
   */
  list = async (req: Request, res: Response): Promise<void> => {
    const {
      warehouse_id, category, supplier, batch, keyword,
      includeEmpty, sort_by, sort_order,
    } = req.query as Record<string, string>;

    const where: any = {};
    if (warehouse_id) where.warehouse_id = Number(warehouse_id);
    if (supplier) where.supplier = supplier;
    if (batch) where.batch = batch;
    if (includeEmpty !== 'true') where.stock_pieces = { [Op.gt]: 0 };

    const productWhere: any = {};
    if (keyword) productWhere.name = { [Op.like]: `%${keyword}%` };
    if (category) productWhere.category = category;

    const dir = (sort_order || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    let order: any = [['updated_at', 'DESC']];
    if (sort_by === 'product_name') {
      order = [[{ model: Product, as: 'product' }, 'name', dir]];
    } else if (sort_by === 'warehouse_name') {
      order = [[{ model: Warehouse, as: 'warehouse' }, 'name', dir]];
    } else if (sort_by === 'nearest_expiry') {
      order = [['nearest_expiry', dir]];
    }

    const rows = await InventoryBalance.findAll({
      where,
      attributes: {
        include: [
          [literal(`(
            SELECT units_per_carton FROM stock_imports
            WHERE product_id = InventoryBalance.product_id
              AND warehouse_id = InventoryBalance.warehouse_id
              AND supplier = InventoryBalance.supplier
              AND batch = InventoryBalance.batch
            ORDER BY import_date DESC, id DESC
            LIMIT 1
          )`), 'units_per_carton'],
        ],
      },
      include: [
        { model: Product, as: 'product',
          where: Object.keys(productWhere).length ? productWhere : undefined,
          include: [{ model: SmallUnit, as: 'defaultSmallUnit' }] },
        { model: Warehouse, as: 'warehouse' },
      ],
      order,
    });

    sendSuccess(res, rows.map(format));
  };

  /**
   * Filter dropdowns cho inventory page (cascading).
   */
  filters = async (req: Request, res: Response): Promise<void> => {
    const { warehouse_id, category, supplier, batch, keyword } = req.query as Record<string, string>;

    const buildWhere = (excludeField?: string) => {
      const where: any = { stock_pieces: { [Op.gt]: 0 } };
      if (warehouse_id && excludeField !== 'warehouse') where.warehouse_id = Number(warehouse_id);
      if (supplier && excludeField !== 'supplier') where.supplier = supplier;
      if (batch && excludeField !== 'batch') where.batch = batch;
      return where;
    };

    const productWhereBase: any = {};
    if (keyword) productWhereBase.name = { [Op.like]: `%${keyword}%` };

    const productWhereWithCategory = (excludeField?: string) => {
      const w = { ...productWhereBase };
      if (category && excludeField !== 'category') w.category = category;
      return Object.keys(w).length ? w : undefined;
    };

    const [warehouses, categories, suppliers, batches] = await Promise.all([
      Warehouse.findAll({
        attributes: ['id', 'name'],
        where: { id: { [Op.in]: literal(`(SELECT DISTINCT warehouse_id FROM inventory_balance WHERE stock_pieces > 0)`) } },
        order: [['name', 'ASC']],
      }),
      Product.findAll({
        attributes: [[fn('DISTINCT', col('category')), 'value']],
        where: { category: { [Op.ne]: null }, id: { [Op.in]: literal(`(SELECT DISTINCT product_id FROM inventory_balance WHERE stock_pieces > 0)`) } },
        order: [['category', 'ASC']],
        raw: true,
      }),
      InventoryBalance.findAll({
        attributes: [[fn('DISTINCT', col('supplier')), 'value']],
        where: buildWhere('supplier'),
        include: productWhereWithCategory('supplier')
          ? [{ model: Product, as: 'product', where: productWhereWithCategory('supplier'), attributes: [] }]
          : [],
        order: [['supplier', 'ASC']],
        raw: true,
      }),
      InventoryBalance.findAll({
        attributes: [[fn('DISTINCT', col('batch')), 'value']],
        where: buildWhere('batch'),
        include: productWhereWithCategory('batch')
          ? [{ model: Product, as: 'product', where: productWhereWithCategory('batch'), attributes: [] }]
          : [],
        order: [['batch', 'ASC']],
        raw: true,
      }),
    ]);

    sendSuccess(res, {
      warehouses: warehouses.map((w: any) => ({ label: w.name, value: w.id })),
      categories: (categories as any[]).map(r => ({ label: r.value, value: r.value })),
      suppliers: (suppliers as any[]).filter(r => r.value).map(r => ({ label: r.value, value: r.value })),
      batches: (batches as any[]).filter(r => r.value).map(r => ({ label: r.value, value: r.value })),
    });
  };

}

function format(row: any) {
  const json = row.toJSON ? row.toJSON() : row;
  const product = json.product || {};
  const smallUnit = product.defaultSmallUnit || null;
  return {
    id: json.id,
    key: String(json.id),
    product_id: json.product_id,
    product_name: product.name || null,
    category: product.category || null,
    warehouse_id: json.warehouse_id,
    warehouse_name: json.warehouse?.name || null,
    supplier: json.supplier,
    batch: json.batch,
    stock_pieces: json.stock_pieces,
    units_per_carton: json.units_per_carton != null ? Number(json.units_per_carton) : null,
    nearest_expiry: json.nearest_expiry,
    small_unit: smallUnit ? { id: smallUnit.id, code: smallUnit.code, label: smallUnit.label } : null,
    updated_at: json.updated_at,
  };
}
