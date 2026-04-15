import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { InventoryController } from '../controllers/inventoryController';

export function InventoryRoutes(): Router {
  const router = Router();
  const c = new InventoryController();
  router.use(authMiddleware);

  /**
   * @swagger
   * tags:
   *   - name: Inventory
   *     description: Xem tồn kho & thống kê
   */

  /**
   * @swagger
   * /api/v1/inventory/stats:
   *   get:
   *     tags: [Inventory]
   *     summary: Thống kê tồn kho
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
   *                   type: object
   *                   properties:
   *                     totalItems: { type: integer, example: 4 }
   *                     totalValue: { type: number, example: 12760000 }
   *                     lowStockCount: { type: integer, example: 1 }
   */
  /**
   * @swagger
   * /api/v1/inventory/filters:
   *   get:
   *     tags: [Inventory]
   *     summary: Lấy danh sách filter options từ database
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Thành công
   */
  router.get('/filters', c.getFilters);

  router.get('/stats', c.getStats);

  /**
   * @swagger
   * /api/v1/inventory:
   *   get:
   *     tags: [Inventory]
   *     summary: Danh sách tồn kho (filter)
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: keyword
   *         schema: { type: string }
   *         description: Tìm theo tên hoặc nhà cung cấp
   *       - in: query
   *         name: warehouse
   *         schema: { type: string }
   *       - in: query
   *         name: category
   *         schema: { type: string }
   *       - in: query
   *         name: supplier
   *         schema: { type: string }
   *       - in: query
   *         name: batch
   *         schema: { type: string }
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
   *                   items: { $ref: '#/components/schemas/InventoryItem' }
   */
  router.get('/', c.getInventory);

  return router;
}
