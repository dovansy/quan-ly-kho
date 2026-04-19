import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';
import { JwtPayload } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'quan-ly-kho-secret-key-2024';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '24h';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';

export class AuthController {
  login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    if (!username || !password) {
      sendError(res, ErrorCode.REQUIRED, 'Username and password are required', 400); return;
    }

    const user = await User.findOne({ where: { username }, include: [{ model: Role, as: 'roles' }] });
    if (!user) { sendError(res, ErrorCode.USER_NOT_FOUND, 'User not found', 404); return; }
    if (user.status !== 'active') { sendError(res, ErrorCode.FORBIDDEN_RESOURCE, 'Account inactive', 403); return; }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) { sendError(res, ErrorCode.WRONG_PASSWORD, 'Wrong password', 401); return; }

    const payload: JwtPayload = { userId: user.id, username: user.username };
    sendSuccess(res, {
      accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL } as jwt.SignOptions),
      refreshToken: jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TTL } as jwt.SignOptions),
      user: formatUser(user),
    });
  };

  getMe = async (req: Request, res: Response): Promise<void> => {
    const user = await User.findByPk(req.user!.userId, {
      include: [{ model: Role, as: 'roles' }],
    });
    if (!user) { sendError(res, ErrorCode.USER_NOT_FOUND, 'User not found', 404); return; }
    sendSuccess(res, formatUser(user));
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.user!;
    const { fullName, email, phone } = req.body;

    if (email) {
      const dup = await User.findOne({ where: { email } });
      if (dup && dup.id !== userId) {
        sendError(res, ErrorCode.EXISTED_USER, 'Email already exists', 409); return;
      }
    }

    await User.update({ full_name: fullName, email, phone }, { where: { id: userId } });
    const user = await User.findByPk(userId, { include: [{ model: Role, as: 'roles' }] });
    sendSuccess(res, formatUser(user!), 'Profile updated successfully');
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.user!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      sendError(res, ErrorCode.REQUIRED, 'Current and new password are required', 400); return;
    }
    if (String(newPassword).length < 6) {
      sendError(res, ErrorCode.EMPTY, 'New password must be at least 6 characters', 400); return;
    }

    const user = await User.findByPk(userId);
    if (!user) { sendError(res, ErrorCode.USER_NOT_FOUND, 'User not found', 404); return; }

    if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
      sendError(res, ErrorCode.WRONG_PASSWORD, 'Current password is incorrect', 401); return;
    }

    await user.update({ password_hash: await bcrypt.hash(newPassword, 10) });
    sendSuccess(res, null, 'Password changed successfully');
  };
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
    roles: (user.roles || []).map((r: any) => ({ id: r.id, role: r.role })),
  };
}
