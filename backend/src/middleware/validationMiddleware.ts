import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '../utils/errorCodes';

export type ValidationRule = (value: unknown, body: Record<string, unknown>) => string | null;

// ── Rule builders ────────────────────────────────────────
export const required = (msg = 'bắt buộc'): ValidationRule =>
  (v) => (v === undefined || v === null || v === '' ? msg : null);

export const minLength = (n: number, msg?: string): ValidationRule =>
  (v) => (typeof v === 'string' && v.length < n ? msg || `phải có ít nhất ${n} ký tự` : null);

export const maxLength = (n: number, msg?: string): ValidationRule =>
  (v) => (typeof v === 'string' && v.length > n ? msg || `không được vượt quá ${n} ký tự` : null);

export const isEmail = (msg = 'email không hợp lệ'): ValidationRule =>
  (v) => (v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v)) ? msg : null);

export const isIn = (values: readonly unknown[], msg?: string): ValidationRule =>
  (v) => (v !== undefined && v !== null && !values.includes(v) ? msg || `chỉ được là: ${values.join(', ')}` : null);

export const isArray = (msg = 'phải là danh sách'): ValidationRule =>
  (v) => (v !== undefined && !Array.isArray(v) ? msg : null);

export const minArrayLength = (n: number, msg?: string): ValidationRule =>
  (v) => (Array.isArray(v) && v.length < n ? msg || `phải có ít nhất ${n} dòng` : null);

export const isNumber = (msg = 'phải là số'): ValidationRule =>
  (v) => (v !== undefined && v !== null && v !== '' && isNaN(Number(v)) ? msg : null);

export const isInt = (msg = 'phải là số nguyên'): ValidationRule =>
  (v) => (v !== undefined && v !== null && v !== '' && !Number.isInteger(Number(v)) ? msg : null);

export const minValue = (n: number, msg?: string): ValidationRule =>
  (v) => (v !== undefined && v !== null && v !== '' && Number(v) < n ? msg || `phải >= ${n}` : null);

export type Schema = Record<string, ValidationRule[]>;

const fieldLabels: Record<string, string> = {
  username: 'Tên đăng nhập',
  password: 'Mật khẩu',
  currentPassword: 'Mật khẩu hiện tại',
  newPassword: 'Mật khẩu mới',
  fullName: 'Họ tên',
  email: 'Email',
  role: 'Vai trò',
  status: 'Trạng thái',
  name: 'Tên',
  code: 'Mã',
  label: 'Tên đơn vị',
  product_name: 'Tên sản phẩm',
  warehouse_id: 'Kho',
  supplier: 'NCC',
  batch: 'Lô',
  small_unit_id: 'Đơn vị lẻ',
  expiry_date: 'Hạn sử dụng',
  customerName: 'Khách hàng',
  saleType: 'Loại bán',
  saleDate: 'Ngày bán',
  items: 'Sản phẩm',
};

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
      const firstField = Object.keys(errors)[0];
      const firstMessage = errors[firstField][0];
      return res.status(400).json({
        code: ErrorCode.REQUIRED,
        message: `${fieldLabels[firstField] || firstField}: ${firstMessage}`,
        data: null,
        errors,
      });
    }
    next();
  };
}
