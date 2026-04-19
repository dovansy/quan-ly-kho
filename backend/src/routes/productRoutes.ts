import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { ProductController } from '../controllers/productController';
import { validate } from '../middleware/validationMiddleware';
import { updateProductSchema } from '../validators';

export function ProductRoutes(): Router {
  const router = Router();
  const c = new ProductController();
  router.use(authMiddleware, authorize('super_admin', 'admin'));

  /**
   * @swagger
   * tags:
   *   - name: Products
   *     description: Catalog sản phẩm (auto-create khi nhập)
   */
  router.get('/categories', c.getCategories);
  router.get('/', c.getProducts);
  router.put('/:id', validate(updateProductSchema), c.updateProduct);

  return router;
}
