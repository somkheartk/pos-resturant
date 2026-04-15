import { HttpStatus } from '@nestjs/common';
import { ApiErrorDefinition } from '../api-error.constants';

export const AUTH_ERROR_MAP: Record<string, ApiErrorDefinition> = {
  AUTH_LOGIN_FAILED: {
    code: 'AUTH_000',
    message: 'Failed to process login.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_006',
    message: 'Invalid email or password.',
    status: HttpStatus.UNAUTHORIZED,
  },
  AUTH_CREATE_FAILED: {
    code: 'AUTH_001',
    message: 'Failed to create auth.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  AUTH_LIST_FAILED: {
    code: 'AUTH_002',
    message: 'Failed to fetch auth list.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  AUTH_GET_FAILED: {
    code: 'AUTH_003',
    message: 'Failed to fetch auth by id.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  AUTH_UPDATE_FAILED: {
    code: 'AUTH_004',
    message: 'Failed to update auth.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  AUTH_DELETE_FAILED: {
    code: 'AUTH_005',
    message: 'Failed to delete auth.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};