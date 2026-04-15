import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, Role } from '../models';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

export class AccountController {
  getAccounts = async (req: Request, res: Response): Promise<void> => {
    const { keyword, status } = req.query as Record<string, string>;

    const where: any = {};
    if (keyword) where[Op.or] = [
      { full_name: { [Op.like]: `%${keyword}%` } },
      { username: { [Op.like]: `%${keyword}%` } },
    ];
    if (status) where.status = status;

    const users = await User.findAll({
      where,
      include: [{ model: Role, as: 'roles', attributes: ['id', 'role'] }],
      order: [['created_at', 'DESC']],
    });

    sendSuccess(res, users.map(formatAccount));
  };

  createAccount = async (req: Request, res: Response): Promise<void> => {
    const { fullName, username, email, phone, password } = req.body;

    if (!username || !password) {
      sendError(res, ErrorCode.REQUIRED, 'Username and password are required', 400); return;
    }
    if (await User.findOne({ where: { username } })) {
      sendError(res, ErrorCode.USERNAME_EXISTED, 'Username already exists', 409); return;
    }
    if (email && await User.findOne({ where: { email } })) {
      sendError(res, ErrorCode.EXISTED_USER, 'Email already exists', 409); return;
    }

    const user = await User.create({
      full_name: fullName, username, email, phone,
      password_hash: await bcrypt.hash(password, 10),
    });

    const adminRole = await Role.findOne({ where: { role: 'admin' } });
    if (adminRole) await (user as any).addRole(adminRole);

    const account = await User.findByPk(user.id, { include: [{ model: Role, as: 'roles' }] });
    sendSuccess(res, formatAccount(account!), 'Account created successfully', 201);
  };

  updateAccount = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { fullName, email, phone, status } = req.body;

    const user = await User.findByPk(id);
    if (!user) { sendError(res, ErrorCode.USER_NOT_FOUND, 'User not found', 404); return; }

    if (email) {
      const dup = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
      if (dup) { sendError(res, ErrorCode.EXISTED_USER, 'Email already exists', 409); return; }
    }

    await user.update({ full_name: fullName, email, phone, status: status || 'active' });

    const account = await User.findByPk(id, { include: [{ model: Role, as: 'roles' }] });
    sendSuccess(res, formatAccount(account!), 'Account updated successfully');
  };

  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted) { sendError(res, ErrorCode.USER_NOT_FOUND, 'User not found', 404); return; }
    sendSuccess(res, null, 'Account deleted successfully');
  };
}

// ── helper ────────────────────────────────────────────────
function formatAccount(user: User) {
  const roles = (user.roles || []) as any[];
  return {
    id: user.id,
    fullName: user.full_name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: roles[0]?.role || null,
    status: user.status,
    key: String(user.id),
  };
}
