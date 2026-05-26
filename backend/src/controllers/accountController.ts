import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import sequelize from '../models/index';
import { User, Role } from '../models';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';
import { UserRole, hasRole } from '../middleware/authMiddleware';

const ALLOWED_ROLES: UserRole[] = ['super_admin', 'admin'];

export class AccountController {
  getAccounts = async (req: Request, res: Response): Promise<void> => {
    const { keyword, status } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (keyword) where[Op.or as unknown as string] = [
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
    const { fullName, username, email, phone, password, role } = req.body;

    if (!username || !password) {
      sendError(res, ErrorCode.REQUIRED, 'Vui lòng nhập tên đăng nhập và mật khẩu', 400); return;
    }
    if (String(password).length < 6) {
      sendError(res, ErrorCode.EMPTY, 'Mật khẩu phải có ít nhất 6 ký tự', 400); return;
    }
    const roleName: UserRole = (role || 'admin') as UserRole;
    if (!ALLOWED_ROLES.includes(roleName)) {
      sendError(res, ErrorCode.REQUIRED, 'Vai trò tài khoản không hợp lệ', 400); return;
    }
    // Only super_admin can create a super_admin account.
    if (roleName === 'super_admin' && !hasRole(req.user, 'super_admin')) {
      sendError(res, ErrorCode.FORBIDDEN_RESOURCE, 'Chỉ super admin được tạo tài khoản super admin', 403); return;
    }

    if (await User.findOne({ where: { username } })) {
      sendError(res, ErrorCode.USERNAME_EXISTED, 'Tên đăng nhập đã tồn tại', 409); return;
    }
    if (email && await User.findOne({ where: { email } })) {
      sendError(res, ErrorCode.EXISTED_USER, 'Email đã được sử dụng', 409); return;
    }

    const roleRow = await Role.findOne({ where: { role: roleName } });
    if (!roleRow) { sendError(res, ErrorCode.NOT_FOUND, 'Vai trò tài khoản chưa được cấu hình', 500); return; }

    const newUser = await sequelize.transaction(async (t) => {
      const user = await User.create({
        full_name: fullName, username, email, phone,
        password_hash: await bcrypt.hash(password, 10),
      }, { transaction: t });
      await (user as any).addRole(roleRow, { transaction: t });
      return user;
    });

    const account = await User.findByPk(newUser.id, { include: [{ model: Role, as: 'roles' }] });
    sendSuccess(res, formatAccount(account!), 'Tạo tài khoản thành công', 201);
  };

  updateAccount = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { fullName, email, phone, status, role } = req.body;

    const user = await User.findByPk(id, { include: [{ model: Role, as: 'roles' }] });
    if (!user) { sendError(res, ErrorCode.USER_NOT_FOUND, 'Tài khoản không tồn tại', 404); return; }

    if (email) {
      const dup = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
      if (dup) { sendError(res, ErrorCode.EXISTED_USER, 'Email đã được tài khoản khác sử dụng', 409); return; }
    }

    const currentRole = (user.roles?.[0] as any)?.role as UserRole | undefined;
    const newRole = role as UserRole | undefined;

    // Role-change guard: only super_admin can promote to/from super_admin.
    if (newRole && newRole !== currentRole) {
      if (!ALLOWED_ROLES.includes(newRole)) {
        sendError(res, ErrorCode.REQUIRED, 'Vai trò tài khoản không hợp lệ', 400); return;
      }
      const touchesSuperAdmin = newRole === 'super_admin' || currentRole === 'super_admin';
      if (touchesSuperAdmin && !hasRole(req.user, 'super_admin')) {
        sendError(res, ErrorCode.FORBIDDEN_RESOURCE, 'Chỉ super admin được đổi vai trò super admin', 403); return;
      }
    }

    await sequelize.transaction(async (t) => {
      await user.update({ full_name: fullName, email, phone, status: status || user.status }, { transaction: t });
      if (newRole && newRole !== currentRole) {
        const roleRow = await Role.findOne({ where: { role: newRole }, transaction: t });
        if (roleRow) await (user as any).setRoles([roleRow], { transaction: t });
      }
    });

    const account = await User.findByPk(id, { include: [{ model: Role, as: 'roles' }] });
    sendSuccess(res, formatAccount(account!), 'Cập nhật tài khoản thành công');
  };

  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    const targetId = Number(req.params.id);
    if (req.user?.userId === targetId) {
      sendError(res, ErrorCode.FORBIDDEN_RESOURCE, 'Không thể xóa tài khoản đang đăng nhập', 403); return;
    }

    const target = await User.findByPk(targetId, { include: [{ model: Role, as: 'roles' }] });
    if (!target) { sendError(res, ErrorCode.USER_NOT_FOUND, 'Tài khoản không tồn tại', 404); return; }

    const targetRole = (target.roles?.[0] as any)?.role as UserRole | undefined;
    // Admin cannot delete admin or super_admin; only super_admin can.
    if ((targetRole === 'admin' || targetRole === 'super_admin') && !hasRole(req.user, 'super_admin')) {
      sendError(res, ErrorCode.FORBIDDEN_RESOURCE, 'Chỉ super admin được xóa tài khoản admin', 403); return;
    }

    await target.destroy();
    sendSuccess(res, null, 'Xóa tài khoản thành công');
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
