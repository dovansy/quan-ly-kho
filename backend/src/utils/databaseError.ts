import { ErrorCode } from './errorCodes';

export type DbAction = 'create' | 'update' | 'delete' | 'read' | 'write';

interface DatabaseErrorResponse {
  code: ErrorCode;
  httpStatus: number;
  message: string;
}

function readMessage(err: any): string {
  return [
    err?.message,
    err?.original?.message,
    err?.parent?.message,
    err?.sqlMessage,
    err?.original?.sqlMessage,
    err?.parent?.sqlMessage,
  ]
    .filter(Boolean)
    .join(' ');
}

function readConstraint(err: any): string {
  return String(
    err?.constraint ||
    err?.original?.constraint ||
    err?.parent?.constraint ||
    err?.index ||
    ''
  );
}

function isForeignKeyError(err: any, raw: string): boolean {
  return (
    err?.name === 'SequelizeForeignKeyConstraintError' ||
    err?.original?.errno === 1451 ||
    err?.parent?.errno === 1451 ||
    raw.includes('foreign key constraint fails')
  );
}

function isUniqueError(err: any, raw: string): boolean {
  return (
    err?.name === 'SequelizeUniqueConstraintError' ||
    err?.original?.errno === 1062 ||
    err?.parent?.errno === 1062 ||
    raw.includes('duplicate entry')
  );
}

function isStockNonNegativeError(raw: string, constraint: string): boolean {
  return raw.includes('chk_ib_stock_nonneg') || constraint.includes('chk_ib_stock_nonneg');
}

export function getDatabaseErrorResponse(err: any, action: DbAction = 'write'): DatabaseErrorResponse {
  const raw = readMessage(err).toLowerCase();
  const constraint = readConstraint(err).toLowerCase();

  if (isStockNonNegativeError(raw, constraint)) {
    const message =
      action === 'delete'
        ? 'Không thể xóa vì lô này đã phát sinh bán hàng, chuyển kho hoặc đơn chờ xuất.'
        : 'Không thể lưu vì số lượng tồn sẽ bị âm. Kiểm tra hàng đã bán, chuyển kho hoặc đang chờ xuất.';

    return { code: ErrorCode.EMPTY, httpStatus: 400, message };
  }

  if (isForeignKeyError(err, raw)) {
    const message =
      action === 'delete'
        ? 'Không thể xóa vì dữ liệu này đang được sử dụng.'
        : 'Không thể lưu vì dữ liệu liên kết không tồn tại.';

    return { code: ErrorCode.DATABASE_ERROR, httpStatus: 400, message };
  }

  if (isUniqueError(err, raw)) {
    return {
      code: ErrorCode.DATABASE_ERROR,
      httpStatus: 409,
      message: 'Không thể lưu vì dữ liệu này đã tồn tại.',
    };
  }

  return {
    code: ErrorCode.DATABASE_ERROR,
    httpStatus: 500,
    message: 'Không thể xử lý dữ liệu. Vui lòng thử lại.',
  };
}
