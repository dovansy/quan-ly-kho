import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { AccountController } from '../controllers/accountController';
import { validate } from '../middleware/validationMiddleware';
import { createAccountSchema, updateAccountSchema } from '../validators';

export function AccountRoutes(): Router {
  const router = Router();
  const c = new AccountController();
  router.use(authMiddleware, authorize('super_admin', 'admin'));

  /**
   * @swagger
   * tags:
   *   - name: Accounts
   *     description: Quản lý tài khoản người dùng
   */

  /**
   * @swagger
   * /api/v1/accounts:
   *   get:
   *     tags: [Accounts]
   *     summary: Danh sách tài khoản
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: keyword
   *         schema: { type: string }
   *         description: Tìm theo họ tên hoặc username
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
   *                   items: { $ref: '#/components/schemas/Account' }
   */
  router.get('/', c.getAccounts);

  /**
   * @swagger
   * /api/v1/accounts:
   *   post:
   *     tags: [Accounts]
   *     summary: Tạo tài khoản mới (gán role admin)
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [username, password]
   *             properties:
   *               fullName: { type: string, example: Trần Thị B }
   *               username: { type: string, example: tranthib }
   *               email: { type: string, example: b@email.com }
   *               phone: { type: string, example: '0912345678' }
   *               password: { type: string, example: pass123, minLength: 6 }
   *     responses:
   *       201:
   *         description: Tạo thành công
   *       409:
   *         description: Username hoặc email đã tồn tại
   */
  router.post('/', validate(createAccountSchema), c.createAccount);

  /**
   * @swagger
   * /api/v1/accounts/{id}:
   *   put:
   *     tags: [Accounts]
   *     summary: Cập nhật tài khoản
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
   *               fullName: { type: string }
   *               email: { type: string }
   *               phone: { type: string }
   *               status: { type: string, enum: [active, inactive] }
   *     responses:
   *       200:
   *         description: Cập nhật thành công
   *       404:
   *         description: Tài khoản không tồn tại
   */
  router.put('/:id', validate(updateAccountSchema), c.updateAccount);

  /**
   * @swagger
   * /api/v1/accounts/{id}:
   *   delete:
   *     tags: [Accounts]
   *     summary: Xóa tài khoản
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
   *         description: Tài khoản không tồn tại
   */
  router.delete('/:id', c.deleteAccount);

  return router;
}
