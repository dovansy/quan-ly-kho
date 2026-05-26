export enum ErrorCode {
  // Validation errors
  REQUIRED = 1001,
  EMPTY = 1002,
  MAX_LENGTH = 1003,
  INVALID_JSON_FORMAT = 1013,
  UNEXPECTED_JSON_FORMAT = 1014,

  // Auth errors (matching frontend HttpErrorCode)
  WRONG_PASSWORD = 4001,
  UNAUTHORIZED = 4010,
  FORBIDDEN_RESOURCE = 4030,
  USER_NOT_FOUND = 4041,
  EXISTED_USER = 40011,
  USERNAME_EXISTED = 40013,

  // Database & server errors
  DATABASE_ERROR = 5001,
  INTERNAL_SERVER_ERROR = 5000,
  DEPENDENCY_INJECTION_ERROR = 5002,

  // Success
  SUCCESS = 2000,

  // Not found
  NOT_FOUND = 4040,
}

export const errorDetails: Record<number, { httpStatus: number; message: string }> = {
  [ErrorCode.REQUIRED]: {
    httpStatus: 400,
    message: 'Thiếu thông tin bắt buộc',
  },
  [ErrorCode.EMPTY]: {
    httpStatus: 400,
    message: 'Dữ liệu không hợp lệ',
  },
  [ErrorCode.MAX_LENGTH]: {
    httpStatus: 400,
    message: 'Dữ liệu vượt quá độ dài cho phép',
  },
  [ErrorCode.INVALID_JSON_FORMAT]: {
    httpStatus: 400,
    message: 'Dữ liệu gửi lên không đúng định dạng JSON',
  },
  [ErrorCode.UNEXPECTED_JSON_FORMAT]: {
    httpStatus: 400,
    message: 'Dữ liệu gửi lên không đúng cấu trúc',
  },
  [ErrorCode.WRONG_PASSWORD]: {
    httpStatus: 401,
    message: 'Mật khẩu không đúng',
  },
  [ErrorCode.UNAUTHORIZED]: {
    httpStatus: 401,
    message: 'Bạn chưa đăng nhập',
  },
  [ErrorCode.FORBIDDEN_RESOURCE]: {
    httpStatus: 403,
    message: 'Bạn không có quyền thực hiện thao tác này',
  },
  [ErrorCode.USER_NOT_FOUND]: {
    httpStatus: 404,
    message: 'Tài khoản không tồn tại',
  },
  [ErrorCode.EXISTED_USER]: {
    httpStatus: 409,
    message: 'Email đã được sử dụng',
  },
  [ErrorCode.USERNAME_EXISTED]: {
    httpStatus: 409,
    message: 'Tên đăng nhập đã tồn tại',
  },
  [ErrorCode.NOT_FOUND]: {
    httpStatus: 404,
    message: 'Dữ liệu không tồn tại',
  },
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    httpStatus: 500,
    message: 'Lỗi hệ thống',
  },
  [ErrorCode.DATABASE_ERROR]: {
    httpStatus: 500,
    message: 'Không thể xử lý dữ liệu',
  },
  [ErrorCode.DEPENDENCY_INJECTION_ERROR]: {
    httpStatus: 500,
    message: 'Thiếu cấu hình hệ thống',
  },
};
