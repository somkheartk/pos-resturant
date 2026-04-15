import { HttpException } from '@nestjs/common';
import { API_ERROR_MAP, ApiErrorKey } from './api-error.constants';

export function throwApiError(
  errorKey: ApiErrorKey,
  originalError?: unknown,
): never {
  const definition = API_ERROR_MAP[errorKey];

  if (originalError instanceof HttpException) {
    throw originalError;
  }

  throw new HttpException(
    {
      errorCode: definition.code,
      message: definition.message,
    },
    definition.status,
  );
}