import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Product, SmallUnit } from '../models';
import { sendSuccess, sendPaginated, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

export class ProductController {
  /**
   * Catalog SP. Auto-create xảy ra ở stockImportController; ở đây chỉ list/update.
   */
  getProducts = async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
    const { keyword, category, supplier, status, sort_by, sort_order } = req.query as Record<string, string>;

    const where: any = {};
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (category) where.category = category;
    if (supplier) where.supplier = supplier;
    if (status) where.status = status;

    const dir = (sort_order || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    let order: any = [['name', 'ASC']];
    if (sort_by === 'name') {
      order = [['name', dir]];
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      attributes: {
        include: [
          [literal(`(
            SELECT units_per_carton FROM stock_imports
            WHERE product_id = Product.id
            ORDER BY import_date DESC, id DESC
            LIMIT 1
          )`), 'units_per_carton'],
        ],
      },
      include: [{ model: SmallUnit, as: 'defaultSmallUnit' }],
      order,
      limit,
      offset: (page - 1) * limit,
    });

    sendPaginated(res, rows.map(formatProduct), page, limit, count);
  };

  updateProduct = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { category, supplier, status, default_small_unit_id } = req.body;

    const product = await Product.findByPk(id);
    if (!product) { sendError(res, ErrorCode.NOT_FOUND, 'Sản phẩm không tồn tại', 404); return; }

    await product.update({
      category: category ?? product.category,
      supplier: supplier ?? product.supplier,
      default_small_unit_id: default_small_unit_id ?? product.default_small_unit_id,
      status: status ?? product.status,
    });

    const refreshed = await Product.findByPk(id, { include: [{ model: SmallUnit, as: 'defaultSmallUnit' }] });
    sendSuccess(res, formatProduct(refreshed!), 'Cập nhật sản phẩm thành công');
  };

  /**
   * Lấy distinct categories từ products để autocomplete.
   */
  getCategories = async (_req: Request, res: Response): Promise<void> => {
    const rows = await Product.findAll({
      attributes: [[fn('DISTINCT', col('category')), 'value']],
      where: { category: { [Op.ne]: null } },
      order: [['category', 'ASC']],
      raw: true,
    });
    sendSuccess(res, (rows as any[]).map(r => ({ label: r.value, value: r.value })));
  };
}

function formatProduct(p: any) {
  const json = p.toJSON ? p.toJSON() : p;
  return {
    id: json.id,
    key: String(json.id),
    name: json.name,
    category: json.category,
    supplier: json.supplier,
    default_small_unit_id: json.default_small_unit_id,
    default_small_unit: json.defaultSmallUnit ? {
      id: json.defaultSmallUnit.id, code: json.defaultSmallUnit.code, label: json.defaultSmallUnit.label,
    } : null,
    units_per_carton: json.units_per_carton != null ? Number(json.units_per_carton) : null,
    status: json.status,
    created_at: json.created_at,
    updated_at: json.updated_at,
  };
}
