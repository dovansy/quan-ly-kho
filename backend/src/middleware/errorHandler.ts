import { Request, Response, NextFunction } from 'express';
import { BaseError as SequelizeError } from 'sequelize';
import { CustomError, typeErrors } from '../utils/customError';
import { ErrorCode } from '../utils/errorCodes';
import logger from '../utils/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return;

  logger.error(`[${req.method} ${req.originalUrl}]`, err);

  // Sequelize validation / unique constraint errors
  if (err instanceof SequelizeError) {
    const message = (err as any).errors?.map((e: any) => e.message).join(', ') || err.message;
    return res.status(400).json({ code: ErrorCode.DATABASE_ERROR, message, data: null });
  }

  // Our custom errors
  if (err instanceof CustomError) {
    return res.status(err.status).json({
      code: err.code, message: err.title || err.message, data: null,
    });
  }

  if (Array.isArray(err) && err[0] instanceof CustomError) {
    const first = err[0];
    return res.status(first.status).json({
      code: first.code, message: first.title, data: null,
      errors: err.map(e => ({ code: e.code, title: e.title, detail: e.detail })),
    });
  }

  // Unknown error
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ code: ErrorCode.INTERNAL_SERVER_ERROR, message, data: null });
}
