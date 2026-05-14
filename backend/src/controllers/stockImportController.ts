import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../models/index';
import { StockImport, Product, Warehouse, SmallUnit, User } from '../models';
import { sendSuccess, sendPaginated, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

export class StockImportController {
  list = async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
    const {
      keyword, warehouse_id, supplier, batch, importDate, productId,
      sort_by, sort_order,
    } = req.query as Record<string, string>;

    const where: any = {};
    if (warehouse_id) where.warehouse_id = Number(warehouse_id);
    if (supplier) where.supplier = supplier;
    if (batch) where.batch = batch;
    if (productId) where.product_id = Number(productId);
    if (importDate) where.import_date = importDate;

    const productWhere: any = {};
    if (keyword) productWhere.name = { [Op.like]: `%${keyword}%` };

    const dir = (sort_order || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    let order: any = [['import_date', 'DESC'], ['created_at', 'DESC']];
    if (sort_by === 'product_name') {
      order = [[{ model: Product, as: 'product' }, 'name', dir]];
    } else if (sort_by === 'warehouse_name') {
      order = [[{ model: Warehouse, as: 'warehouse' }, 'name', dir]];
    } else if (sort_by === 'expiry_date') {
      order = [['expiry_date', dir]];
    } else if (sort_by === 'import_date') {
      order = [['import_date', dir], ['created_at', dir]];
    }

    const { count, rows } = await StockImport.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', where: Object.keys(productWhere).length ? productWhere : undefined,
          include: [{ model: SmallUnit, as: 'defaultSmallUnit' }] },
        { model: Warehouse, as: 'warehouse' },
        { model: SmallUnit, as: 'smallUnit' },
        { model: User, as: 'importer', attributes: ['id', 'username', 'full_name'] },
      ],
      order,
      limit,
      offset: (page - 1) * limit,
    });

    sendPaginated(res, rows.map(format), page, limit, count);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const {
      product_name, category,
      warehouse_id, supplier, batch, small_unit_id,
      carton_quantity = 0, units_per_carton = 1, piece_quantity = 0,
      expiry_date, import_date, note,
      input_mode, input_total_pieces, units_per_box,
    } = req.body;

    if (!product_name) { sendError(res, ErrorCode.REQUIRED, 'product_name là bắt buộc', 400); return; }
    if (!warehouse_id) { sendError(res, ErrorCode.REQUIRED, 'warehouse_id là bắt buộc', 400); return; }
    if (!supplier) { sendError(res, ErrorCode.REQUIRED, 'supplier là bắt buộc', 400); return; }
    if (!batch) { sendError(res, ErrorCode.REQUIRED, 'batch là bắt buộc', 400); return; }
    if (!small_unit_id) { sendError(res, ErrorCode.REQUIRED, 'small_unit_id là bắt buộc', 400); return; }
    if (carton_quantity <= 0 && piece_quantity <= 0) {
      sendError(res, ErrorCode.EMPTY, 'Số lượng nhập phải > 0', 400); return;
    }

    const userId = req.user?.userId || null;

    const created = await sequelize.transaction(async (t) => {
      const [product, wasCreated] = await Product.findOrCreate({
        where: { name: product_name },
        defaults: {
          name: product_name,
          category: category || null,
          supplier: supplier || null,
          default_small_unit_id: small_unit_id,
          status: 'active',
        },
        transaction: t,
      });

      if (!wasCreated && !product.supplier && supplier) {
        await product.update({ supplier }, { transaction: t });
      }

      const row = await StockImport.create({
        product_id: product.id,
        warehouse_id, supplier, batch,
        small_unit_id,
        carton_quantity, units_per_carton, piece_quantity,
        expiry_date: expiry_date || null,
        imported_by_user_id: userId,
        import_date: import_date || new Date(),
        note: note || null,
        input_total_pieces:
          input_mode === 'vien'
            ? Number(input_total_pieces || 0) || null
            : input_total_pieces != null
              ? Number(input_total_pieces) || null
              : null,
        units_per_box: units_per_box != null ? Number(units_per_box) || null : null,
      }, { transaction: t });

      return row;
    });

    const refreshed = await fetchOne(created.id);
    sendSuccess(res, format(refreshed!), 'Nhập hàng thành công', 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const row = await StockImport.findByPk(id);
    if (!row) { sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy bản ghi nhập', 404); return; }

    const {
      category,
      warehouse_id, supplier, batch, small_unit_id,
      carton_quantity, units_per_carton, piece_quantity,
      expiry_date, import_date, note,
      input_mode, input_total_pieces, units_per_box,
    } = req.body;

    try {
      await sequelize.transaction(async (t) => {
        if (category !== undefined) {
          const product = await Product.findByPk(row.product_id, { transaction: t });
          if (product) {
            const next = category || null;
            if ((product.category ?? null) !== next) {
              await product.update({ category: next }, { transaction: t });
            }
          }
        }

        await row.update({
          warehouse_id: warehouse_id ?? row.warehouse_id,
          supplier: supplier ?? row.supplier,
          batch: batch ?? row.batch,
          small_unit_id: small_unit_id ?? row.small_unit_id,
          carton_quantity: carton_quantity ?? row.carton_quantity,
          units_per_carton: units_per_carton ?? row.units_per_carton,
          piece_quantity: piece_quantity ?? row.piece_quantity,
          expiry_date: expiry_date ?? row.expiry_date,
          import_date: import_date ?? row.import_date,
          note: note ?? row.note,
          input_total_pieces:
            input_mode === 'vien'
              ? Number(input_total_pieces || 0) || null
              : input_mode === 'kien'
                ? null
                : input_total_pieces !== undefined
                  ? input_total_pieces != null ? Number(input_total_pieces) || null : null
                  : row.input_total_pieces,
          units_per_box:
            units_per_box !== undefined
              ? units_per_box != null ? Number(units_per_box) || null : null
              : row.units_per_box,
        }, { transaction: t });
      });
    } catch (err: any) {
      if (err?.original?.message?.includes('chk_ib_stock_nonneg')) {
        sendError(res, ErrorCode.EMPTY, 'Cập nhật khiến tồn kho âm — đã có hàng xuất từ lô này', 400); return;
      }
      throw err;
    }

    const refreshed = await fetchOne(Number(id));
    sendSuccess(res, format(refreshed!), 'Cập nhật bản ghi nhập thành công');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const deleted = await StockImport.destroy({ where: { id } });
      if (!deleted) { sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy bản ghi nhập', 404); return; }
      sendSuccess(res, null, 'Xóa bản ghi nhập thành công');
    } catch (err: any) {
      if (err?.original?.message?.includes('chk_ib_stock_nonneg')) {
        sendError(res, ErrorCode.EMPTY, 'Không xóa được — đã có hàng xuất từ lô này', 400); return;
      }
      throw err;
    }
  };
}

async function fetchOne(id: number) {
  return StockImport.findByPk(id, {
    include: [
      { model: Product, as: 'product', include: [{ model: SmallUnit, as: 'defaultSmallUnit' }] },
      { model: Warehouse, as: 'warehouse' },
      { model: SmallUnit, as: 'smallUnit' },
      { model: User, as: 'importer', attributes: ['id', 'username', 'full_name'] },
    ],
  });
}

function format(row: any) {
  const json = row.toJSON ? row.toJSON() : row;
  const upc = json.units_per_carton || 1;
  const total_pieces = (json.carton_quantity || 0) * upc + (json.piece_quantity || 0);
  return {
    id: json.id, key: String(json.id),
    product_id: json.product_id,
    product_name: json.product?.name || null,
    category: json.product?.category || null,
    warehouse_id: json.warehouse_id,
    warehouse_name: json.warehouse?.name || null,
    supplier: json.supplier,
    batch: json.batch,
    small_unit_id: json.small_unit_id,
    small_unit: json.smallUnit ? { id: json.smallUnit.id, code: json.smallUnit.code, label: json.smallUnit.label } : null,
    carton_quantity: json.carton_quantity,
    units_per_carton: upc,
    piece_quantity: json.piece_quantity,
    total_pieces,
    expiry_date: json.expiry_date,
    imported_by: json.importer ? (json.importer.full_name || json.importer.username) : null,
    import_date: json.import_date,
    note: json.note,
    input_total_pieces: json.input_total_pieces ?? null,
    units_per_box: json.units_per_box ?? null,
    created_at: json.created_at,
    updated_at: json.updated_at,
  };
}
