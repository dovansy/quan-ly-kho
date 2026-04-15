import { body, validateRequest } from '../middleware/validationMiddleware';
import { ErrorCode } from '../utils/errorCodes';

export const setMessageValidator = validateRequest([
  body('message').notNull().withErrorCode(ErrorCode.REQUIRED)
    .notEmpty().withErrorCode(ErrorCode.EMPTY)
    .maxLength(35).withErrorCode(ErrorCode.MAX_LENGTH),
]);
