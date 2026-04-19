import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '../utils/errorCodes';

export type ValidationRule = (value: unknown, body: Record<string, unknown>) => string | null;

// ── Rule builders ────────────────────────────────────────
export const required = (msg = 'is required'): ValidationRule =>
  (v) => (v === undefined || v === null || v === '' ? msg : null);

export const minLength = (n: number, msg?: string): ValidationRule =>
  (v) => (typeof v === 'string' && v.length < n ? msg || `must be at least ${n} characters` : null);

export const maxLength = (n: number, msg?: string): ValidationRule =>
  (v) => (typeof v === 'string' && v.length > n ? msg || `must be at most ${n} characters` : null);

export const isEmail = (msg = 'invalid email'): ValidationRule =>
  (v) => (v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v)) ? msg : null);

export const isIn = (values: readonly unknown[], msg?: string): ValidationRule =>
  (v) => (v !== undefined && v !== null && !values.includes(v) ? msg || `must be one of: ${values.join(', ')}` : null);

export const isArray = (msg = 'must be an array'): ValidationRule =>
  (v) => (v !== undefined && !Array.isArray(v) ? msg : null);

export const minArrayLength = (n: number, msg?: string): ValidationRule =>
  (v) => (Array.isArray(v) && v.length < n ? msg || `must have at least ${n} items` : null);

export const isNumber = (msg = 'must be a number'): ValidationRule =>
  (v) => (v !== undefined && v !== null && v !== '' && isNaN(Number(v)) ? msg : null);

export const isInt = (msg = 'must be an integer'): ValidationRule =>
  (v) => (v !== undefined && v !== null && v !== '' && !Number.isInteger(Number(v)) ? msg : null);

export const minValue = (n: number, msg?: string): ValidationRule =>
  (v) => (v !== undefined && v !== null && v !== '' && Number(v) < n ? msg || `must be >= ${n}` : null);

export type Schema = Record<string, ValidationRule[]>;

/**
 * Validate req.body against the given schema. Aggregates all errors and returns
 * 400 with `{ errors: { field: [messages] } }` if any rule fails.
 */
export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string[]> = {};
    for (const [field, rules] of Object.entries(schema)) {
      const value = (req.body as Record<string, unknown>)?.[field];
      for (const rule of rules) {
        const msg = rule(value, (req.body || {}) as Record<string, unknown>);
        if (msg) (errors[field] ||= []).push(msg);
      }
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        code: ErrorCode.REQUIRED,
        message: 'Validation failed',
        data: null,
        errors,
      });
    }
    next();
  };
}
