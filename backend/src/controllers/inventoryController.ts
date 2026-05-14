import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../models/index';
import { InventoryBalance, InventoryTransfer, Product, Warehouse, SmallUnit, StockExport, User } from '../models';
import { sendSuccess, sendPaginated, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

export class InventoryController {
  /**
   * GET /inventory — đọc trực tiếp từ inventory_balance (maintained bởi trigger).
   * Default: chỉ trả về dòng có stock_pieces > 0.
   */
  list = async (req: Request, res: Response): Promise<void> => {
    const {
      warehouse_id, category, supplier, batch, keyword,
      includeEmpty, exclude_pending_sale_order_id, sort_by, sort_order,
    } = req.query as Record<string, string>;
    const excludeSaleOrderId = Number(exclude_pending_sale_order_id) || 0;

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
              AND supplier = InventoryBalance.supplier
              AND batch = InventoryBalance.batch
            ORDER BY (warehouse_id = InventoryBalance.warehouse_id) DESC,
                     import_date DESC, id DESC
            LIMIT 1
          )`), 'units_per_carton'],
          [literal(`(
            SELECT COALESCE(SUM(quantity), 0) FROM stock_exports
            WHERE is_pending = 1
              AND product_id = InventoryBalance.product_id
              AND warehouse_id = InventoryBalance.warehouse_id
              AND supplier = InventoryBalance.supplier
              AND batch = InventoryBalance.batch
              ${excludeSaleOrderId ? `AND sale_order_id <> ${excludeSaleOrderId}` : ''}
          )`), 'pending_reserved'],
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

    const [warehouseIds, categoryProductIds, suppliers, batches] = await Promise.all([
      InventoryBalance.findAll({
        attributes: [[fn('DISTINCT', col('warehouse_id')), 'warehouse_id']],
        where: buildWhere('warehouse'),
        include: productWhereWithCategory('warehouse')
          ? [{ model: Product, as: 'product', where: productWhereWithCategory('warehouse'), attributes: [] }]
          : [],
        raw: true,
      }),
      InventoryBalance.findAll({
        attributes: [[fn('DISTINCT', col('product_id')), 'product_id']],
        where: buildWhere('category'),
        include: productWhereWithCategory('category')
          ? [{ model: Product, as: 'product', where: productWhereWithCategory('category'), attributes: [] }]
          : [],
        raw: true,
      }),
      InventoryBalance.findAll({
        attributes: [[col('InventoryBalance.supplier'), 'value']],
        where: buildWhere('supplier'),
        include: productWhereWithCategory('supplier')
          ? [{ model: Product, as: 'product', where: productWhereWithCategory('supplier'), attributes: [] }]
          : [],
        group: [col('InventoryBalance.supplier')],
        order: [[col('InventoryBalance.supplier'), 'ASC']],
        raw: true,
      }),
      InventoryBalance.findAll({
        attributes: [[col('InventoryBalance.batch'), 'value']],
        where: buildWhere('batch'),
        include: productWhereWithCategory('batch')
          ? [{ model: Product, as: 'product', where: productWhereWithCategory('batch'), attributes: [] }]
          : [],
        group: [col('InventoryBalance.batch')],
        order: [[col('InventoryBalance.batch'), 'ASC']],
        raw: true,
      }),
    ]);

    const [warehouses, categoryRows] = await Promise.all([
      Warehouse.findAll({
        attributes: ['id', 'name'],
        where: { id: { [Op.in]: (warehouseIds as any[]).map(r => r.warehouse_id) } },
        order: [['name', 'ASC']],
      }),
      Product.findAll({
        attributes: [[fn('DISTINCT', col('category')), 'value']],
        where: {
          category: { [Op.ne]: null },
          id: { [Op.in]: (categoryProductIds as any[]).map(r => r.product_id) },
        },
        order: [['category', 'ASC']],
        raw: true,
      }),
    ]);

    sendSuccess(res, {
      warehouses: warehouses.map((w: any) => ({ label: w.name, value: w.id })),
      categories: (categoryRows as any[]).filter(r => r.value).map(r => ({ label: r.value, value: r.value })),
      suppliers: (suppliers as any[]).filter(r => r.value).map(r => ({ label: r.value, value: r.value })),
      batches: (batches as any[]).filter(r => r.value).map(r => ({ label: r.value, value: r.value })),
    });
  };

  /**
   * POST /inventory/transfer — chuyển kho.
   * Body: { product_id, warehouse_id_from, warehouse_id_to, supplier, batch, quantity }
   * Decrement source, upsert destination row trong cùng transaction.
   */
  transfer = async (req: Request, res: Response): Promise<void> => {
    const {
      product_id, warehouse_id_from, warehouse_id_to,
      supplier, batch, quantity,
    } = req.body;

    if (!product_id || !warehouse_id_from || !warehouse_id_to || !supplier || !batch) {
      sendError(res, ErrorCode.REQUIRED, 'Thiếu thông tin chuyển kho', 400);
      return;
    }
    if (Number(warehouse_id_from) === Number(warehouse_id_to)) {
      sendError(res, ErrorCode.EMPTY, 'Kho đích phải khác kho nguồn', 400);
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      sendError(res, ErrorCode.EMPTY, 'Số lượng chuyển phải > 0', 400);
      return;
    }

    const userId = req.user?.userId || null;
    const note = (req.body?.note ?? null) as string | null;

    try {
      await sequelize.transaction(async (t) => {
        const source = await InventoryBalance.findOne({
          where: {
            product_id: Number(product_id),
            warehouse_id: Number(warehouse_id_from),
            supplier, batch,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!source) throw new Error('NOT_FOUND_SOURCE');
        // Trừ hàng đang chờ xuất ra khỏi tồn khả dụng để chuyển kho
        const pendingSum = (await StockExport.sum('quantity', {
          where: {
            is_pending: true,
            product_id: Number(product_id),
            warehouse_id: Number(warehouse_id_from),
            supplier, batch,
          },
          transaction: t,
        })) || 0;
        const availableForTransfer = source.stock_pieces - pendingSum;
        if (availableForTransfer < qty) throw new Error('INSUFFICIENT_STOCK');

        await source.update(
          { stock_pieces: source.stock_pieces - qty },
          { transaction: t }
        );

        const dest = await InventoryBalance.findOne({
          where: {
            product_id: Number(product_id),
            warehouse_id: Number(warehouse_id_to),
            supplier, batch,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (dest) {
          // Match đúng (product, supplier, batch) → cộng dồn stock.
          // Giữ nearest_expiry sớm hơn (cùng batch thì expiry phải bằng nhau, nhưng defensive).
          const nextExpiry = (() => {
            if (!source.nearest_expiry) return dest.nearest_expiry;
            if (!dest.nearest_expiry) return source.nearest_expiry;
            return source.nearest_expiry < dest.nearest_expiry
              ? source.nearest_expiry
              : dest.nearest_expiry;
          })();
          await dest.update(
            { stock_pieces: dest.stock_pieces + qty, nearest_expiry: nextExpiry },
            { transaction: t }
          );
        } else {
          // Khác thông tin (chưa có batch này ở kho đích) → tạo row mới với stock = qty.
          await InventoryBalance.create(
            {
              product_id: Number(product_id),
              warehouse_id: Number(warehouse_id_to),
              supplier, batch,
              stock_pieces: qty,
              nearest_expiry: source.nearest_expiry,
            },
            { transaction: t }
          );
        }

        // Ghi nhật ký chuyển kho
        await InventoryTransfer.create(
          {
            product_id: Number(product_id),
            warehouse_id_from: Number(warehouse_id_from),
            warehouse_id_to: Number(warehouse_id_to),
            supplier, batch,
            quantity: qty,
            transferred_by_user_id: userId,
            transfer_date: new Date(),
            note: note || null,
          },
          { transaction: t }
        );
      });

      sendSuccess(res, null, 'Chuyển kho thành công');
    } catch (err: any) {
      if (err?.message === 'NOT_FOUND_SOURCE') {
        sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy lô hàng nguồn', 404);
        return;
      }
      if (err?.message === 'INSUFFICIENT_STOCK') {
        sendError(res, ErrorCode.EMPTY, 'Tồn kho nguồn không đủ', 400);
        return;
      }
      throw err;
    }
  };

  /**
   * GET /inventory/transfers — danh sách lịch sử chuyển kho
   */
  transfersList = async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
    const {
      keyword, warehouse_id_from, warehouse_id_to, supplier, batch, transferDate,
    } = req.query as Record<string, string>;

    const where: any = {};
    if (warehouse_id_from) where.warehouse_id_from = Number(warehouse_id_from);
    if (warehouse_id_to) where.warehouse_id_to = Number(warehouse_id_to);
    if (supplier) where.supplier = supplier;
    if (batch) where.batch = batch;
    if (transferDate) {
      const d = new Date(transferDate);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      where.transfer_date = { [Op.gte]: d, [Op.lt]: next };
    }

    const productWhere: any = {};
    if (keyword) productWhere.name = { [Op.like]: `%${keyword}%` };

    const { count, rows } = await InventoryTransfer.findAndCountAll({
      where,
      attributes: {
        include: [
          [literal(`(
            SELECT units_per_carton FROM stock_imports
            WHERE product_id = InventoryTransfer.product_id
              AND supplier = InventoryTransfer.supplier
              AND batch = InventoryTransfer.batch
            ORDER BY import_date DESC, id DESC
            LIMIT 1
          )`), 'units_per_carton'],
        ],
      },
      include: [
        {
          model: Product, as: 'product',
          where: Object.keys(productWhere).length ? productWhere : undefined,
          include: [{ model: SmallUnit, as: 'defaultSmallUnit' }],
        },
        { model: Warehouse, as: 'warehouseFrom' },
        { model: Warehouse, as: 'warehouseTo' },
        { model: User, as: 'transferredBy', attributes: ['id', 'username', 'full_name'] },
      ],
      order: [['transfer_date', 'DESC'], ['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    sendPaginated(res, rows.map(formatTransfer), page, limit, count);
  };

}

function formatTransfer(row: any) {
  const json = row.toJSON ? row.toJSON() : row;
  const product = json.product || {};
  const smallUnit = product.defaultSmallUnit || null;
  return {
    id: json.id,
    key: String(json.id),
    product_id: json.product_id,
    product_name: product.name || null,
    category: product.category || null,
    warehouse_id_from: json.warehouse_id_from,
    warehouse_from_name: json.warehouseFrom?.name || null,
    warehouse_id_to: json.warehouse_id_to,
    warehouse_to_name: json.warehouseTo?.name || null,
    supplier: json.supplier,
    batch: json.batch,
    quantity: json.quantity,
    units_per_carton: json.units_per_carton != null ? Number(json.units_per_carton) : null,
    small_unit: smallUnit ? { id: smallUnit.id, code: smallUnit.code, label: smallUnit.label } : null,
    transferred_by: json.transferredBy ? (json.transferredBy.full_name || json.transferredBy.username) : null,
    transfer_date: json.transfer_date,
    note: json.note,
    created_at: json.created_at,
  };
}

function format(row: any) {
  const json = row.toJSON ? row.toJSON() : row;
  const product = json.product || {};
  const smallUnit = product.defaultSmallUnit || null;
  const rawStock = Number(json.stock_pieces) || 0;
  const pendingReserved = Number(json.pending_reserved) || 0;
  const available = Math.max(0, rawStock - pendingReserved);
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
    stock_pieces: rawStock,
    available_pieces: available,
    pending_reserved: pendingReserved,
    units_per_carton: json.units_per_carton != null ? Number(json.units_per_carton) : null,
    nearest_expiry: json.nearest_expiry,
    small_unit: smallUnit ? { id: smallUnit.id, code: smallUnit.code, label: smallUnit.label } : null,
    updated_at: json.updated_at,
  };
}
