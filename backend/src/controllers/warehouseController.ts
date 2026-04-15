import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Warehouse, Product } from '../models';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

export class WarehouseController {
  getWarehouses = async (req: Request, res: Response): Promise<void> => {
    const { keyword, status } = req.query as Record<string, string>;

    const where: any = {};
    if (keyword) where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { address: { [Op.like]: `%${keyword}%` } },
      { manager: { [Op.like]: `%${keyword}%` } },
    ];
    if (status) where.status = status;

    const warehouses = await Warehouse.findAll({
      where,
      attributes: {
        include: [
          [literal('(SELECT COUNT(*) FROM products WHERE products.warehouse_id = `Warehouse`.`id`)'), 'productCount'],
          [literal('(SELECT COALESCE(SUM(quantity * unit_price), 0) FROM products WHERE products.warehouse_id = `Warehouse`.`id`)'), 'inventoryValue'],
        ],
      },
      order: [['created_at', 'DESC']],
    });

    sendSuccess(res, warehouses.map(w => {
      const json = w.toJSON() as any;
      return { ...json, key: String(w.id), productCount: Number(json.productCount), inventoryValue: Number(json.inventoryValue) };
    }));
  };

  createWarehouse = async (req: Request, res: Response): Promise<void> => {
    const { name, address, manager, status } = req.body;
    if (!name) { sendError(res, ErrorCode.REQUIRED, 'Warehouse name is required', 400); return; }

    const warehouse = await Warehouse.create({ name, address, manager, status: status || 'active' });
    sendSuccess(res, { ...warehouse.toJSON(), key: String(warehouse.id), productCount: 0, inventoryValue: 0 }, 'Warehouse created successfully', 201);
  };

  updateWarehouse = async (req: Request, res: Response): Promise<void> => {
    const { name, address, manager, status } = req.body;

    const [updated] = await Warehouse.update(
      { name, address, manager, status: status || 'active' },
      { where: { id: req.params.id } },
    );
    if (!updated) { sendError(res, ErrorCode.NOT_FOUND, 'Warehouse not found', 404); return; }

    // Refetch with computed stats
    const [warehouse] = await Warehouse.findAll({
      where: { id: req.params.id },
      attributes: {
        include: [
          [literal('(SELECT COUNT(*) FROM products WHERE products.warehouse_id = `Warehouse`.`id`)'), 'productCount'],
          [literal('(SELECT COALESCE(SUM(quantity * unit_price), 0) FROM products WHERE products.warehouse_id = `Warehouse`.`id`)'), 'inventoryValue'],
        ],
      },
    });
    const json = warehouse.toJSON() as any;
    sendSuccess(res, { ...json, key: String(warehouse.id), productCount: Number(json.productCount), inventoryValue: Number(json.inventoryValue) }, 'Warehouse updated successfully');
  };

  deleteWarehouse = async (req: Request, res: Response): Promise<void> => {
    const deleted = await Warehouse.destroy({ where: { id: req.params.id } });
    if (!deleted) { sendError(res, ErrorCode.NOT_FOUND, 'Warehouse not found', 404); return; }
    sendSuccess(res, null, 'Warehouse deleted successfully');
  };

  getWarehousesList = async (_req: Request, res: Response): Promise<void> => {
    const warehouses = await Warehouse.findAll({
      attributes: ['id', 'name'],
      where: { status: 'active' },
      order: [['name', 'ASC']],
    });
    sendSuccess(res, warehouses.map(w => ({ label: w.name, value: w.name, id: w.id })));
  };
}
