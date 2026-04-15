import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Product, Warehouse } from '../models';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

function formatDateDDMMYYYY(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export class InventoryController {
  getInventory = async (req: Request, res: Response): Promise<void> => {
    const { warehouse, category, supplier, batch, keyword } = req.query as Record<string, string>;

    const where: any = {};
    if (keyword) where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { supplier: { [Op.like]: `%${keyword}%` } },
    ];
    if (warehouse) where.warehouse_name = warehouse;
    if (category)  where.category = category;
    if (supplier)  where.supplier = supplier;
    if (batch)     where.batch = batch;

    const products = await Product.findAll({ where, order: [['created_at', 'DESC']] });

    sendSuccess(res, products.map(p => ({
      key: String(p.id),
      name: p.name,
      warehouse: p.warehouse_name,
      category: p.category,
      supplier: p.supplier,
      batch: p.batch,
      quantity: p.quantity,
      minStock: p.min_stock,
      price: p.unit_price,
      unit: p.unit,
      expiryDate: p.expiry_date,
      importDate: formatDateDDMMYYYY((p as any).createdAt || p.created_at),
    })));
  };

  getFilters = async (req: Request, res: Response): Promise<void> => {
    const { warehouse, category, supplier, batch, keyword } = req.query as Record<string, string>;

    const toOptions = (rows: any[], field: string) =>
      rows.map(r => ({ label: r[field], value: r[field] }));

    // Tất cả dropdown đều filter theo tất cả fields đã chọn (trừ chính nó)
    const buildWhere = (excludeField?: string) => {
      const where: any = {};
      if (warehouse && excludeField !== 'warehouse') where.warehouse_name = warehouse;
      if (category && excludeField !== 'category')   where.category = category;
      if (supplier && excludeField !== 'supplier')   where.supplier = supplier;
      if (batch && excludeField !== 'batch')         where.batch = batch;
      if (keyword) where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { supplier: { [Op.like]: `%${keyword}%` } },
      ];
      return where;
    };

    // Kho: nếu chưa có filter nào (trừ warehouse) → lấy tất cả kho active từ bảng warehouses
    // Nếu đã có filter khác → lấy distinct warehouse_name từ products (cascading)
    const hasOtherFilters = category || supplier || batch || keyword;
    const warehouseQuery = hasOtherFilters
      ? Product.findAll({ attributes: [[fn('DISTINCT', col('warehouse_name')), 'name']], where: { warehouse_name: { [Op.ne]: null }, ...buildWhere('warehouse') }, order: [['warehouse_name', 'ASC']], raw: true })
      : Warehouse.findAll({ attributes: ['name'], where: { status: 'active' }, order: [['name', 'ASC']], raw: true });

    const [warehouses, categories, suppliers, batches] = await Promise.all([
      warehouseQuery,
      Product.findAll({ attributes: [[fn('DISTINCT', col('category')), 'category']], where: { category: { [Op.ne]: null }, ...buildWhere('category') }, order: [['category', 'ASC']], raw: true }),
      Product.findAll({ attributes: [[fn('DISTINCT', col('supplier')), 'supplier']], where: { supplier: { [Op.ne]: null }, ...buildWhere('supplier') }, order: [['supplier', 'ASC']], raw: true }),
      Product.findAll({ attributes: [[fn('DISTINCT', col('batch')), 'batch']], where: { batch: { [Op.ne]: null }, ...buildWhere('batch') }, order: [['batch', 'ASC']], raw: true }),
    ]);

    sendSuccess(res, {
      warehouses: toOptions(warehouses, 'name'),
      categories: toOptions(categories, 'category'),
      suppliers: toOptions(suppliers, 'supplier'),
      batches: toOptions(batches, 'batch'),
    });
  };

  getStats = async (req: Request, res: Response): Promise<void> => {
    const { warehouse, category, supplier, batch, keyword } = req.query as Record<string, string>;

    const where: any = {};
    if (warehouse) where.warehouse_name = warehouse;
    if (category)  where.category = category;
    if (supplier)  where.supplier = supplier;
    if (batch)     where.batch = batch;
    if (keyword) where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { supplier: { [Op.like]: `%${keyword}%` } },
    ];

    const totalItems = await Product.count({ where });
    const [agg] = await Product.findAll({
      attributes: [
        [fn('COALESCE', fn('SUM', literal('quantity * unit_price')), 0), 'totalValue'],
        [fn('COALESCE', fn('SUM', literal('CASE WHEN quantity <= min_stock THEN 1 ELSE 0 END')), 0), 'lowStockCount'],
      ],
      where,
      raw: true,
    }) as any[];

    sendSuccess(res, {
      totalItems,
      totalValue: Number(agg.totalValue) || 0,
      lowStockCount: Number(agg.lowStockCount) || 0,
    });
  };
}
