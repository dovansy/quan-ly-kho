import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { SaleController } from '../controllers/saleController';

export function SaleRoutes(): Router {
  const router = Router();
  const c = new SaleController();
  router.use(authMiddleware);

  /**
   * @swagger
   * tags:
   *   - name: Sales
   *     description: Quản lý hóa đơn bán hàng
   */

  /**
   * @swagger
   * /api/v1/sales:
   *   get:
   *     tags: [Sales]
   *     summary: Danh sách hóa đơn (phân trang + filter)
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
   *         description: Tìm theo tên khách hàng hoặc mã hóa đơn
   *       - in: query
   *         name: paid
   *         schema: { type: string, enum: ['true', 'false'] }
   *         description: Trạng thái thanh toán
   *       - in: query
   *         name: saleDate
   *         schema: { type: string, format: date }
   *         description: "Lọc theo ngày bán (YYYY-MM-DD)"
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
   *                   items: { $ref: '#/components/schemas/Sale' }
   *                 metadata: { $ref: '#/components/schemas/PaginationMeta' }
   */
  router.get('/', c.getSales);

  /**
   * @swagger
   * /api/v1/sales:
   *   post:
   *     tags: [Sales]
   *     summary: Tạo hóa đơn bán hàng
   *     description: Mã hóa đơn tự động sinh theo format HD-YYYYMMDD-XXX
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [customerName, saleType, saleDate, items]
   *             properties:
   *               customerName: { type: string, example: Nguyễn Văn A }
   *               customerPhone: { type: string, example: '0901234567' }
   *               saleType: { type: string, enum: [wholesale, retail] }
   *               paid: { type: boolean, default: false }
   *               saleDate: { type: string, format: date, example: '2024-03-15' }
   *               createdBy: { type: string }
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required: [productName, quantity]
   *                   properties:
   *                     productName: { type: string, example: Paracetamol 500mg }
   *                     quantity: { type: integer, example: 10 }
   *                     unit: { type: string, example: hộp }
   *                     unitPrice: { type: number, example: 1500 }
   *                     total: { type: number, example: 15000 }
   *     responses:
   *       201:
   *         description: Tạo thành công
   */
  router.post('/', c.createSale);

  /**
   * @swagger
   * /api/v1/sales/{id}:
   *   put:
   *     tags: [Sales]
   *     summary: Cập nhật hóa đơn
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
   *               customerName: { type: string }
   *               customerPhone: { type: string }
   *               saleType: { type: string, enum: [wholesale, retail] }
   *               paid: { type: boolean }
   *               saleDate: { type: string, format: date }
   *               items: { type: array, items: { type: object } }
   *     responses:
   *       200:
   *         description: Cập nhật thành công
   *       404:
   *         description: Hóa đơn không tồn tại
   */
  router.put('/:id', c.updateSale);

  /**
   * @swagger
   * /api/v1/sales/{id}:
   *   delete:
   *     tags: [Sales]
   *     summary: Xóa hóa đơn
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
   *         description: Hóa đơn không tồn tại
   */
  router.delete('/:id', c.deleteSale);

  return router;
}
