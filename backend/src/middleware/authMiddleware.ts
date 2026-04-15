import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';

const JWT_SECRET = process.env.JWT_SECRET || 'quan-ly-kho-secret-key-2024';

export interface JwtPayload {
  userId: number;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, ErrorCode.UNAUTHORIZED, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return sendError(res, ErrorCode.UNAUTHORIZED, 'Invalid or expired token', 401);
  }
}
