import { Request, Response, NextFunction } from 'express';

import { CustomError, typeErrors } from '../utils/customError';

type ValidationRule = {
  validate: (value: unknown) => boolean;
  errorCode: number;
};

enum typeParameters {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params'
}

class ValidationChain {
  private field: string;
  private rules: ValidationRule[];
  private typeParameter: typeParameters;

  constructor(field: string, typeParameter: typeParameters) {
    this.field = field;
    this.rules = [];
    this.typeParameter = typeParameter;
  }

  notNull() {
    this.rules.push({
      validate: (value) => value !== null && value !== undefined,
      errorCode: 0,
    });
    return this;
  }

  notEmpty() {
    this.rules.push({
      validate: (value) => {
        if (value === null || value === undefined) return true; // let notNull handle this
        return String(value).trim().length > 0;
      },
      errorCode: 0,
    });
    return this;
  }

  isNumber() {
    this.rules.push({
      validate: (value) => {
        if (value === null || value === undefined) return true;
        return !isNaN(Number(value));
      },
      errorCode: 0,
    });
    return this;
  }

  maxLength(length: number) {
    this.rules.push({
      validate: (value) => {
        if (value === null || value === undefined) return true;
        return String(value).length <= length;
      },
      errorCode: 0,
    });
    return this;
  }

  /** @deprecated Use maxLength instead */
  MaxLength(length: number) {
    return this.maxLength(length);
  }

  minLength(length: number) {
    this.rules.push({
      validate: (value) => {
        if (value === null || value === undefined) return true;
        return String(value).length >= length;
      },
      errorCode: 0,
    });
    return this;
  }

  withErrorCode(errorCode: number) {
    if (this.rules.length > 0) {
      this.rules[this.rules.length - 1].errorCode = errorCode;
    }
    return this;
  }

  getField() {
    return this.field;
  }

  getRules() {
    return this.rules;
  }

  getTypeParameter(): typeParameters {
    return this.typeParameter;
  }
}

export const body = (field: string) => new ValidationChain(field, typeParameters.BODY);
export const query = (field: string) => new ValidationChain(field, typeParameters.QUERY);
export const params = (field: string) => new ValidationChain(field, typeParameters.PARAMS);

function getValueFromRequest(req: Request, typeParam: typeParameters, field: string): unknown {
  switch (typeParam) {
    case typeParameters.BODY: return req.body[field];
    case typeParameters.PARAMS: return req.params[field];
    case typeParameters.QUERY: return req.query[field];
  }
}

export function validateRequest(validators: ValidationChain[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errorsResult: CustomError[] = [];

    for (const validator of validators) {
      const value = getValueFromRequest(req, validator.getTypeParameter(), validator.getField());

      for (const rule of validator.getRules()) {
        if (!rule.validate(value)) {
          errorsResult.push(
            new CustomError(rule.errorCode, typeErrors.VALIDATION_ERROR, req.originalUrl, null),
          );
        }
      }
    }

    if (errorsResult.length > 0) {
      next(errorsResult);
    } else {
      next();
    }
  };
}
