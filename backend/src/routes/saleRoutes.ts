import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { SaleController } from '../controllers/saleController';
import { validate } from '../middleware/validationMiddleware';
import { createSaleSchema, updateSaleSchema } from '../validators';

export function SaleRoutes(): Router {
  const router = Router();
  const c = new SaleController();
  router.use(authMiddleware, authorize('super_admin', 'admin'));

  /**
   * @swagger
   * tags:
   *   - name: Sales
   *     description: Hóa đơn xuất hàng (sale_orders + stock_exports)
   */
  router.get('/', c.list);
  router.post('/', validate(createSaleSchema), c.create);
  router.put('/:id', validate(updateSaleSchema), c.update);
  router.post('/:id/return', c.returnOrder);
  router.delete('/:id', c.remove);

  return router;
}
