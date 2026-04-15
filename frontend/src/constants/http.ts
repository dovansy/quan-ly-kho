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
  [HttpErrorCode.WRONG_PASSWORD]: 'Incorrect password',
  [HttpErrorCode.USER_NOT_FOUND]: 'There is not an admin account associated with this email.',
  [HttpErrorCode.UNKNOWN_ERROR]: 'Something went wrong. Please try again!',
  [HttpErrorCode.UNAUTHORIZED]: 'Unauthorized',
  [HttpErrorCode.EXISTED_USER]: 'There is already an account associated with this email.',
  [HttpErrorCode.DEACTIVATED_USER]:
    'Your account has been suspended. Please contact super admin for support.',
  [HttpErrorCode.WAGER_NOT_FOUND]: 'Invalid wager',
  [HttpErrorCode.AMOUNT_WIN_NOT_ENOUGH]:
    'The adjustment value exceeds the settlement amount of this wager',
  [HttpErrorCode.AMOUNT_LOSE_NOT_ENOUGH]:
    'The adjustment value exceeds the settlement amount of this wager',
};
