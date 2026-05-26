import rateLimit from 'express-rate-limit';
import { ErrorCode } from '../utils/errorCodes';

const tooManyRequests = {
  code: ErrorCode.FORBIDDEN_RESOURCE,
  message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
  data: null,
};

/**
 * Strict limiter for auth endpoints (login, password change).
 * Mitigates brute-force and credential stuffing attacks.
 * 10 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooManyRequests,
  skipSuccessfulRequests: true,
});

/**
 * General API limiter. Protects against basic flooding.
 * 300 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooManyRequests,
});
