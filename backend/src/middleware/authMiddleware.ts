import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models';
import { sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

const JWT_SECRET = process.env.JWT_SECRET || 'quan-ly-kho-secret-key-2024';

export type UserRole = 'super_admin' | 'admin';

export interface JwtPayload {
  userId: number;
  username: string;
}

export interface AuthenticatedUser extends JwtPayload {
  roles: UserRole[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Verify JWT, load user + roles from DB, attach to req.user.
 * Rejects inactive accounts. Required on every protected route.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, ErrorCode.UNAUTHORIZED, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return sendError(res, ErrorCode.UNAUTHORIZED, 'Invalid or expired token', 401);
  }

  const user = await User.findByPk(decoded.userId, {
    include: [{ model: Role, as: 'roles', attributes: ['role'] }],
  });
  // Missing/inactive users get 401 so the frontend's httpClient auto-logs them out.
  if (!user) return sendError(res, ErrorCode.UNAUTHORIZED, 'Session invalid, please log in again', 401);
  if (user.status !== 'active') return sendError(res, ErrorCode.UNAUTHORIZED, 'Account inactive', 401);

  req.user = {
    userId: decoded.userId,
    username: decoded.username,
    roles: (user.roles || []).map((r: any) => r.role as UserRole),
  };
  next();
}

/**
 * Allow request only if current user has at least one of the given roles.
 * Register after `authMiddleware`.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    const ok = req.user.roles.some(r => allowedRoles.includes(r));
    if (!ok) return sendError(res, ErrorCode.FORBIDDEN_RESOURCE, 'Insufficient permission', 403);
    next();
  };
}

export const hasRole = (user: AuthenticatedUser | undefined, role: UserRole): boolean =>
  !!user && user.roles.includes(role);
