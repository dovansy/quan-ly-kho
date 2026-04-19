import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { InventoryController } from '../controllers/inventoryController';

export function InventoryRoutes(): Router {
  const router = Router();
  const c = new InventoryController();
  router.use(authMiddleware, authorize('super_admin', 'admin'));

  /**
   * @swagger
   * tags:
   *   - name: Inventory
   *     description: Xem tồn kho (đọc từ inventory_balance)
   */
  router.get('/filters', c.filters);
  router.get('/', c.list);

  return router;
}
