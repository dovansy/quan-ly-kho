import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validationMiddleware';
import { loginSchema, updateProfileSchema, changePasswordSchema } from '../validators';

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
   *                 example: superadmin
   *               password:
   *                 type: string
   *                 example: super123
   *     responses:
   *       200:
   *         description: Login thành công
   *       401:
   *         description: Sai mật khẩu
   *       404:
   *         description: User không tồn tại
   */
  router.post('/auth/login', authLimiter, validate(loginSchema), c.login);

  /**
   * @swagger
   * /api/v1/auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Lấy thông tin user hiện tại
   *     security:
   *       - BearerAuth: []
   */
  router.get('/auth/me', authMiddleware, c.getMe);

  /**
   * @swagger
   * /api/v1/auth/profile:
   *   put:
   *     tags: [Auth]
   *     summary: Cập nhật thông tin cá nhân
   *     security:
   *       - BearerAuth: []
   */
  router.put('/auth/profile', authMiddleware, validate(updateProfileSchema), c.updateProfile);

  /**
   * @swagger
   * /api/v1/auth/change-password:
   *   put:
   *     tags: [Auth]
   *     summary: Đổi mật khẩu
   *     security:
   *       - BearerAuth: []
   */
  router.put('/auth/change-password', authLimiter, authMiddleware, validate(changePasswordSchema), c.changePassword);

  return router;
}
