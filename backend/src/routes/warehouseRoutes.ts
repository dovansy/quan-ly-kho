import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { WarehouseController } from '../controllers/warehouseController';

export function WarehouseRoutes(): Router {
  const router = Router();
  const c = new WarehouseController();
  router.use(authMiddleware);

  /**
   * @swagger
   * tags:
   *   - name: Warehouses
   *     description: Quản lý kho
   */

  /**
   * @swagger
   * /api/v1/warehouses/list:
   *   get:
   *     tags: [Warehouses]
   *     summary: Danh sách kho đang hoạt động (cho dropdown)
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Thành công
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code: { type: integer, example: 2000 }
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id: { type: integer }
   *                       label: { type: string }
   *                       value: { type: string }
   */
  router.get('/list', c.getWarehousesList);

  /**
   * @swagger
   * /api/v1/warehouses:
   *   get:
   *     tags: [Warehouses]
   *     summary: Danh sách tất cả kho (kèm thống kê)
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: keyword
   *         schema: { type: string }
   *         description: Tìm theo tên, địa chỉ, người quản lý
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [active, inactive] }
   *     responses:
   *       200:
   *         description: Thành công
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code: { type: integer, example: 2000 }
   *                 data:
   *                   type: array
   *                   items: { $ref: '#/components/schemas/Warehouse' }
   */
  router.get('/', c.getWarehouses);

  /**
   * @swagger
   * /api/v1/warehouses:
   *   post:
   *     tags: [Warehouses]
   *     summary: Tạo kho mới
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name: { type: string, example: Kho Hà Nội }
   *               address: { type: string, example: 123 Cầu Giấy }
   *               manager: { type: string, example: Nguyễn Văn A }
   *               status: { type: string, enum: [active, inactive], default: active }
   *     responses:
   *       201:
   *         description: Tạo thành công
   */
  router.post('/', c.createWarehouse);

  /**
   * @swagger
   * /api/v1/warehouses/{id}:
   *   put:
   *     tags: [Warehouses]
   *     summary: Cập nhật kho
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               address: { type: string }
   *               manager: { type: string }
   *               status: { type: string, enum: [active, inactive] }
   *     responses:
   *       200:
   *         description: Cập nhật thành công
   *       404:
   *         description: Kho không tồn tại
   */
  router.put('/:id', c.updateWarehouse);

  /**
   * @swagger
   * /api/v1/warehouses/{id}:
   *   delete:
   *     tags: [Warehouses]
   *     summary: Xóa kho
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Xóa thành công
   *       404:
   *         description: Kho không tồn tại
   */
  router.delete('/:id', c.deleteWarehouse);

  return router;
}
