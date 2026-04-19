import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { StockImportController } from '../controllers/stockImportController';
import { validate } from '../middleware/validationMiddleware';
import { createStockImportSchema } from '../validators';

export function StockImportRoutes(): Router {
  const router = Router();
  const c = new StockImportController();
  router.use(authMiddleware, authorize('super_admin', 'admin'));

  /**
   * @swagger
   * tags:
   *   - name: StockImports
   *     description: Bảng nhập hàng (auto-create product nếu chưa có)
   */
  router.get('/', c.list);
  router.post('/', validate(createStockImportSchema), c.create);
  router.put('/:id', c.update);
  router.delete('/:id', c.remove);

  return router;
}
