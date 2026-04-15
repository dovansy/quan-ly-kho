import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

export function AuthRoutes(): Router {
  const router = Router();
  const c = new AuthController();

  /**
   * @swagger
   * tags:
   *   - name: Auth
   *     description: Authentication & user profile
   */

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Đăng nhập
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [username, password]
   *             properties:
   *               username:
   *                 type: string
   *                 example: admin
   *               password:
   *                 type: string
   *                 example: admin123
   *     responses:
   *       200:
   *         description: Login thành công
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code: { type: integer, example: 2000 }
   *                 message: { type: string }
   *                 data:
   *                   type: object
   *                   properties:
   *                     accessToken: { type: string }
   *                     refreshToken: { type: string }
   *                     user: { $ref: '#/components/schemas/User' }
   *       401:
   *         description: Sai mật khẩu
   *       404:
   *         description: User không tồn tại
   */
  router.post('/auth/login', c.login.bind(c));

  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Đăng ký tài khoản mới
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [fullName, username, email, password]
   *             properties:
   *               fullName: { type: string, example: Nguyen Van A }
   *               username: { type: string, example: nguyenvana }
   *               email: { type: string, example: a@email.com }
   *               phone: { type: string, example: '0901234567' }
   *               password: { type: string, example: pass123 }
   *     responses:
   *       201:
   *         description: Đăng ký thành công
   *       409:
   *         description: Email hoặc username đã tồn tại
   */
  router.post('/auth/register', c.register.bind(c));

  /**
   * @swagger
   * /api/v1/auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Lấy thông tin user hiện tại
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
   *                 data: { $ref: '#/components/schemas/User' }
   *       401:
   *         description: Chưa đăng nhập
   */
  router.get('/auth/me', authMiddleware, c.getMe.bind(c));

  /**
   * @swagger
   * /api/v1/auth/profile:
   *   put:
   *     tags: [Auth]
   *     summary: Cập nhật thông tin cá nhân
   *     security:
   *       - BearerAuth: []
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
   *     responses:
   *       200:
   *         description: Cập nhật thành công
   */
  router.put('/auth/profile', authMiddleware, c.updateProfile.bind(c));

  /**
   * @swagger
   * /api/v1/auth/change-password:
   *   put:
   *     tags: [Auth]
   *     summary: Đổi mật khẩu
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [currentPassword, newPassword]
   *             properties:
   *               currentPassword: { type: string }
   *               newPassword: { type: string, minLength: 6 }
   *     responses:
   *       200:
   *         description: Đổi mật khẩu thành công
   *       401:
   *         description: Mật khẩu hiện tại sai
   */
  router.put('/auth/change-password', authMiddleware, c.changePassword.bind(c));

  return router;
}
