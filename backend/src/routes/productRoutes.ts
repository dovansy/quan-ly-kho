import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { ProductController } from '../controllers/productController';

export function ProductRoutes(): Router {
  const router = Router();
  const c = new ProductController();
  router.use(authMiddleware);

  /**
   * @swagger
   * tags:
   *   - name: Products
   *     description: Quản lý sản phẩm
   */

  /**
   * @swagger
   * /api/v1/products/options:
   *   get:
   *     tags: [Products]
   *     summary: Lấy danh sách filter options (categories, warehouses, suppliers, batches)
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
   *                     categories: { type: array, items: { $ref: '#/components/schemas/SelectOption' } }
   *                     warehouses: { type: array, items: { $ref: '#/components/schemas/SelectOption' } }
   *                     suppliers: { type: array, items: { $ref: '#/components/schemas/SelectOption' } }
   *                     batches: { type: array, items: { $ref: '#/components/schemas/SelectOption' } }
   */
  router.get('/options', c.getOptions);

  /**
   * @swagger
   * /api/v1/products/batches:
   *   get:
   *     tags: [Products]
   *     summary: Danh sách lô theo sản phẩm và kho
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: name
   *         schema: { type: string }
   *         description: Tên sản phẩm
   *       - in: query
   *         name: warehouse
   *         schema: { type: string }
   *         description: Tên kho
   *     responses:
   *       200:
   *         description: Thành công
   */
  router.get('/batches', c.getBatches);

  /**
   * @swagger
   * /api/v1/products/list:
   *   get:
   *     tags: [Products]
   *     summary: Danh sách sản phẩm đơn giản (cho dropdown)
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
   *                       price: { type: number }
   */
  router.get('/list', c.getProductsList);

  /**
   * @swagger
   * /api/v1/products:
   *   get:
   *     tags: [Products]
   *     summary: Danh sách sản phẩm (phân trang + filter)
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 50 }
   *       - in: query
   *         name: keyword
   *         schema: { type: string }
   *         description: Tìm theo tên hoặc nhà cung cấp
   *       - in: query
   *         name: category
   *         schema: { type: string }
   *       - in: query
   *         name: warehouse
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
   *                   items: { $ref: '#/components/schemas/Product' }
   *                 metadata: { $ref: '#/components/schemas/PaginationMeta' }
   */
  router.get('/', c.getProducts);

  /**
   * @swagger
   * /api/v1/products:
   *   post:
   *     tags: [Products]
   *     summary: Tạo sản phẩm mới
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
   *               name: { type: string, example: Paracetamol 500mg }
   *               category: { type: string, example: Thuốc giảm đau }
   *               warehouse: { type: string, example: Kho Chẵn }
   *               batch: { type: string, example: BATCH001 }
   *               unitPrice: { type: number, example: 1500 }
   *               importedBy: { type: string }
   *               supplier: { type: string }
   *               unit: { type: string }
   *               minStock: { type: integer }
   *               unitEntries:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     unit: { type: string, example: kiện }
   *                     quantity: { type: integer, example: 100 }
   *                     conversionRate: { type: integer, example: 5 }
   *     responses:
   *       201:
   *         description: Tạo thành công
   */
  router.post('/', c.createProduct);

  /**
   * @swagger
   * /api/v1/products/{id}:
   *   put:
   *     tags: [Products]
   *     summary: Cập nhật sản phẩm
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
   *               category: { type: string }
   *               warehouse: { type: string }
   *               batch: { type: string }
   *               unitPrice: { type: number }
   *               importedBy: { type: string }
   *               unitEntries: { type: array, items: { type: object } }
   *     responses:
   *       200:
   *         description: Cập nhật thành công
   *       404:
   *         description: Sản phẩm không tồn tại
   */
  router.put('/:id', c.updateProduct);

  /**
   * @swagger
   * /api/v1/products/{id}:
   *   delete:
   *     tags: [Products]
   *     summary: Xóa sản phẩm
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
   *         description: Sản phẩm không tồn tại
   */
  router.delete('/:id', c.deleteProduct);

  return router;
}
