import { Response } from 'express';
import { ErrorCode } from './errorCodes';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalCurrentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPageSize: number;
}

export function sendSuccess<T>(res: Response, data: T, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    code: ErrorCode.SUCCESS,
    message,
    data,
  });
}

export function sendPaginated<T>(res: Response, data: T[], page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  const metadata: PaginationMeta = {
    page,
    limit,
    total,
    totalCurrentPage: data.length,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    currentPageSize: data.length,
  };

  return res.status(200).json({
    code: ErrorCode.SUCCESS,
    message: 'Success',
    data,
    metadata,
  });
}

export function sendError(res: Response, code: number, message: string, httpStatus = 400) {
  return res.status(httpStatus).json({
    code,
    message,
    data: null,
  });
}
