export enum HttpErrorCode {
  WRONG_PASSWORD = 4001,
  VERIFY_SIGNATURE_FAILED = 4002,
  VERIFY_RECAPTCHA_FAIL = 4003,
  VERIFY_2FA_FAILED = 4004,
  GOOGLE_AUTH_CODE_EMPTY = 4005,
  INCORRECT_GOOGLE_CODE = 4006,
  ENABLED_2FA = 4007,
  EMAIL_NOT_INTERGRATED = 4008,
  USER_REVOKED = 4009,
  PHONE_EXIST = 40010,
  EXISTED_USER = 40011,
  INVALID_TOKEN = 40012,
  USERNAME_EXISTED = 40013,
  GENERATE_VAULT_FAILED = 40014,
  REFERENCE_CODE_EXISTED = 40015,
  GG_ACCOUNT_LINKED = 40016,
  METAMASK_ACCOUNT_LINKED = 40017,
  INCORRECT_REFERENCE_CODE = 40018,
  VERIFY_GOOGLE_CODE_FAILED = 400019,
  DEACTIVATED_USER = 40020,
  EMAIL_NOT_ASSOCIATED = 40021,
  // Unauthorized
  UNAUTHORIZED = 4010,
  // Forbiden
  FORBIDDEN_RESOURCE = 4030,
  // Not found
  ADMIN_NOT_FOUND = 4040,
  USER_NOT_FOUND = 4041,
  // System
  OTHER_SYSTEM_ERROR = 5000,
  // unknown code
  UNKNOWN_ERROR = 9999,
  SUCCESS = 2000,
  WAGER_NOT_FOUND = 12008,
  AMOUNT_WIN_NOT_ENOUGH = 2010,
  AMOUNT_LOSE_NOT_ENOUGH = 2012,
}

export const HttpErrorMessage: Record<HttpErrorCode | number | string, string> = {
  [HttpErrorCode.WRONG_PASSWORD]: 'Mật khẩu không đúng',
  [HttpErrorCode.USER_NOT_FOUND]: 'Tên đăng nhập không tồn tại',
  [HttpErrorCode.UNKNOWN_ERROR]: 'Đã có lỗi xảy ra. Vui lòng thử lại!',
  [HttpErrorCode.UNAUTHORIZED]: 'Phiên đăng nhập đã hết hạn',
  [HttpErrorCode.EXISTED_USER]: 'Tài khoản đã tồn tại',
  [HttpErrorCode.DEACTIVATED_USER]:
    'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ super admin.',
  [HttpErrorCode.WAGER_NOT_FOUND]: 'Không tìm thấy bản ghi',
  [HttpErrorCode.AMOUNT_WIN_NOT_ENOUGH]:
    'Giá trị điều chỉnh vượt quá số tiền thanh toán',
  [HttpErrorCode.AMOUNT_LOSE_NOT_ENOUGH]:
    'Giá trị điều chỉnh vượt quá số tiền thanh toán',
};
