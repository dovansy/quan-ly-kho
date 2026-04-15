import { Request, Response } from 'express';
import { Op, fn, col } from 'sequelize';
import sequelize from '../models/index';
import { Product, ProductUnitEntry, Warehouse } from '../models';
import { sendSuccess, sendPaginated, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

export class ProductController {
  getProducts = async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
    const { keyword, category, warehouse } = req.query as Record<string, string>;

    const where: any = {};
    if (keyword) where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { supplier: { [Op.like]: `%${keyword}%` } },
    ];
    if (category) where.category = category;
    if (warehouse) where.warehouse_name = warehouse;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: ProductUnitEntry, as: 'unitEntries' }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    const result = rows.map(p => ({
      ...p.toJSON(),
      key: String(p.id),
      unitEntries: (p.unitEntries || []).map(e => ({
        id: e.id, unit: e.unit, quantity: e.quantity, conversionRate: e.conversion_rate,
      })),
    }));

    sendPaginated(res, result, page, limit, count);
  };

  createProduct = async (req: Request, res: Response): Promise<void> => {
    const { name, category, warehouse, batch, unitEntries, unitPrice, importedBy, expiryDate } = req.body;
    if (!name) { sendError(res, ErrorCode.REQUIRED, 'Product name is required', 400); return; }

    const newQuantity = (unitEntries || [])
      .reduce((sum: number, e: any) => sum + (e.quantity || 0) * (e.conversionRate || 1), 0);

    const wh = warehouse ? await Warehouse.findOne({ where: { name: warehouse } }) : null;

    // Kiểm tra trùng: cùng tên + cùng kho + cùng lô → cộng dồn
    const existing = await Product.findOne({
      where: {
        name,
        ...(wh ? { warehouse_id: wh.id } : { warehouse_name: warehouse || null }),
        batch: batch || null,
      },
    });

    if (existing) {
      await sequelize.transaction(async (t) => {
        await existing.update({
          quantity: existing.quantity + newQuantity,
          unit_price: unitPrice || existing.unit_price,
          category: category || existing.category,
          supplier: req.body.supplier || existing.supplier,
          imported_by: importedBy || existing.imported_by,
          expiry_date: expiryDate || existing.expiry_date,
        }, { transaction: t });

        if (unitEntries?.length) {
          await ProductUnitEntry.bulkCreate(
            unitEntries.map((e: any) => ({
              product_id: existing.id, unit: e.unit, quantity: e.quantity, conversion_rate: e.conversionRate || 1,
            })),
            { transaction: t },
          );
        }
      });

      const result = await this.findProductWithEntries(existing.id);
      sendSuccess(res, result, 'Stock added to existing product', 200);
      return;
    }

    const product = await sequelize.transaction(async (t) => {
      const p = await Product.create({
        name, category, warehouse_id: wh?.id || null, warehouse_name: warehouse || null,
        supplier: req.body.supplier, batch, quantity: newQuantity,
        min_stock: req.body.minStock || 0, unit_price: unitPrice || 0,
        unit: req.body.unit, imported_by: importedBy,
        expiry_date: expiryDate || null,
      }, { transaction: t });

      if (unitEntries?.length) {
        await ProductUnitEntry.bulkCreate(
          unitEntries.map((e: any) => ({
            product_id: p.id, unit: e.unit, quantity: e.quantity, conversion_rate: e.conversionRate || 1,
          })),
          { transaction: t },
        );
      }
      return p;
    });

    const result = await this.findProductWithEntries(product.id);
    sendSuccess(res, result, 'Product created successfully', 201);
  };

  updateProduct = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, category, warehouse, batch, unitEntries, unitPrice, importedBy, expiryDate } = req.body;
    const addStock = req.query.addStock === 'true';

    const product = await Product.findByPk(id);
    if (!product) { sendError(res, ErrorCode.NOT_FOUND, 'Product not found', 404); return; }

    const newQuantity = (unitEntries || [])
      .reduce((sum: number, e: any) => sum + (e.quantity || 0) * (e.conversionRate || 1), 0);

    // Nếu nhập thêm hàng → cộng dồn số lượng cũ + mới
    const finalQuantity = addStock ? product.quantity + newQuantity : newQuantity;

    const wh = warehouse ? await Warehouse.findOne({ where: { name: warehouse } }) : null;

    await sequelize.transaction(async (t) => {
      await product.update({
        name, category, warehouse_id: wh?.id || null, warehouse_name: warehouse || null,
        supplier: req.body.supplier, batch, quantity: finalQuantity,
        min_stock: req.body.minStock || 0, unit_price: unitPrice || 0,
        unit: req.body.unit, imported_by: importedBy,
        expiry_date: expiryDate !== undefined ? (expiryDate || null) : product.expiry_date,
      }, { transaction: t });

      if (!addStock) {
        // Sửa SP → thay thế unitEntries
        await ProductUnitEntry.destroy({ where: { product_id: id }, transaction: t });
      }
      if (unitEntries?.length) {
        await ProductUnitEntry.bulkCreate(
          unitEntries.map((e: any) => ({
            product_id: id, unit: e.unit, quantity: e.quantity, conversion_rate: e.conversionRate || 1,
          })),
          { transaction: t },
        );
      }
    });

    const result = await this.findProductWithEntries(Number(id));
    sendSuccess(res, result, addStock ? 'Stock added successfully' : 'Product updated successfully');
  };

  deleteProduct = async (req: Request, res: Response): Promise<void> => {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    if (!deleted) { sendError(res, ErrorCode.NOT_FOUND, 'Product not found', 404); return; }
    sendSuccess(res, null, 'Product deleted successfully');
  };

  getOptions = async (_req: Request, res: Response): Promise<void> => {
    const [categories, warehouses, suppliers, batches] = await Promise.all([
      Product.findAll({ attributes: [[fn('DISTINCT', col('category')), 'value']], where: { category: { [Op.ne]: null } }, order: [['category', 'ASC']], raw: true }),
      Product.findAll({ attributes: [[fn('DISTINCT', col('warehouse_name')), 'value']], where: { warehouse_name: { [Op.ne]: null } }, order: [['warehouse_name', 'ASC']], raw: true }),
      Product.findAll({ attributes: [[fn('DISTINCT', col('supplier')), 'value']], where: { supplier: { [Op.ne]: null } }, order: [['supplier', 'ASC']], raw: true }),
      Product.findAll({ attributes: [[fn('DISTINCT', col('batch')), 'value']], where: { batch: { [Op.ne]: null } }, order: [['batch', 'ASC']], raw: true }),
    ]);

    const toOptions = (rows: any[]) => rows.map(r => ({ label: r.value, value: r.value }));
    sendSuccess(res, {
      categories: toOptions(categories),
      warehouses: toOptions(warehouses),
      suppliers: toOptions(suppliers),
      batches: toOptions(batches),
    });
  };

  getBatches = async (req: Request, res: Response): Promise<void> => {
    const { name, warehouse } = req.query as Record<string, string>;

    const where: any = { batch: { [Op.ne]: null } };
    if (name) where.name = name;
    if (warehouse) where.warehouse_name = warehouse;

    const rows = await Product.findAll({
      attributes: [[fn('DISTINCT', col('batch')), 'value']],
      where,
      order: [['batch', 'ASC']],
      raw: true,
    });

    sendSuccess(res, (rows as any[]).map(r => ({ label: r.value, value: r.value })));
  };

  getProductsList = async (_req: Request, res: Response): Promise<void> => {
    const products = await Product.findAll({
      attributes: ['id', 'name', 'unit_price'],
      order: [['name', 'ASC']],
    });
    sendSuccess(res, products.map(p => ({
      label: p.name, value: p.name, price: Number(p.unit_price), id: p.id,
    })));
  };

  // ── helper ──────────────────────────────────────────────
  private async findProductWithEntries(id: number) {
    const p = await Product.findByPk(id, { include: [{ model: ProductUnitEntry, as: 'unitEntries' }] });
    if (!p) return null;
    return {
      ...p.toJSON(),
      key: String(p.id),
      unitEntries: (p.unitEntries || []).map(e => ({
        id: e.id, unit: e.unit, quantity: e.quantity, conversionRate: e.conversion_rate,
      })),
    };
  }
}
