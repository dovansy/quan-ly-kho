import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';
import { JwtPayload } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'quan-ly-kho-secret-key-2024';

export class AuthController {
  async login(req: Request, res: Response) {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username }, include: [{ model: Role, as: 'roles' }] });
    if (!user) return sendError(res, ErrorCode.USER_NOT_FOUND, 'User not found', 404);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return sendError(res, ErrorCode.WRONG_PASSWORD, 'Wrong password', 401);

    const payload: JwtPayload = { userId: user.id, username: user.username };

    return sendSuccess(res, {
      accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }),
      refreshToken: jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }),
      user: formatUser(user),
    });
  }

  async register(req: Request, res: Response) {
    const { fullName, username, email, phone, password } = req.body;

    if (await User.findOne({ where: { email } }))
      return sendError(res, ErrorCode.EXISTED_USER, 'Email already exists', 409);
    if (await User.findOne({ where: { username } }))
      return sendError(res, ErrorCode.USERNAME_EXISTED, 'Username already exists', 409);

    const user = await User.create({
      full_name: fullName, username, email, phone,
      password_hash: await bcrypt.hash(password, 10),
    });

    const adminRole = await Role.findOne({ where: { role: 'admin' } });
    if (adminRole) await (user as any).addRole(adminRole);

    const payload: JwtPayload = { userId: user.id, username };
    const roles = adminRole ? [{ id: adminRole.id, role: adminRole.role }] : [];

    return sendSuccess(res, {
      accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }),
      refreshToken: jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }),
      user: { id: user.id, email, username, phone, status: 'active', walletAddress: '', roles },
    }, 'User registered successfully', 201);
  }

  async getMe(req: Request, res: Response) {
    const user = await User.findByPk((req.user as JwtPayload).userId, {
      include: [{ model: Role, as: 'roles' }],
    });
    if (!user) return sendError(res, ErrorCode.USER_NOT_FOUND, 'User not found', 404);

    return sendSuccess(res, formatUser(user));
  }

  async updateProfile(req: Request, res: Response) {
    const { userId } = req.user as JwtPayload;
    const { fullName, email, phone } = req.body;

    if (email) {
      const dup = await User.findOne({ where: { email } });
      if (dup && dup.id !== userId) return sendError(res, ErrorCode.EXISTED_USER, 'Email already exists', 409);
    }

    await User.update({ full_name: fullName, email, phone }, { where: { id: userId } });

    const user = await User.findByPk(userId, { include: [{ model: Role, as: 'roles' }] });
    return sendSuccess(res, formatUser(user!), 'Profile updated successfully');
  }

  async changePassword(req: Request, res: Response) {
    const { userId } = req.user as JwtPayload;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return sendError(res, ErrorCode.REQUIRED, 'Current and new password are required', 400);
    if (newPassword.length < 6)
      return sendError(res, ErrorCode.EMPTY, 'New password must be at least 6 characters', 400);

    const user = await User.findByPk(userId);
    if (!user) return sendError(res, ErrorCode.USER_NOT_FOUND, 'User not found', 404);

    if (!(await bcrypt.compare(currentPassword, user.password_hash)))
      return sendError(res, ErrorCode.WRONG_PASSWORD, 'Current password is incorrect', 401);

    await user.update({ password_hash: await bcrypt.hash(newPassword, 10) });
    return sendSuccess(res, null, 'Password changed successfully');
  }
}

// ── helper ────────────────────────────────────────────────
function formatUser(user: User) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    username: user.username,
    phone: user.phone,
    status: user.status,
    walletAddress: '',
    roles: (user.roles || []).map((r: any) => ({ id: r.id, role: r.role })),
  };
}
