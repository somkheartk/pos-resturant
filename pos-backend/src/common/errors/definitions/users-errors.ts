import { HttpStatus } from '@nestjs/common';
import { ApiErrorDefinition } from '../api-error.constants';

export const USERS_ERROR_MAP: Record<string, ApiErrorDefinition> = {
  USERS_CREATE_FAILED: {
    code: 'USR_001',
    message: 'Failed to create user.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  USERS_LIST_FAILED: {
    code: 'USR_002',
    message: 'Failed to fetch user list.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  USERS_GET_FAILED: {
    code: 'USR_003',
    message: 'Failed to fetch user by id.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  USERS_UPDATE_FAILED: {
    code: 'USR_004',
    message: 'Failed to update user.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  USERS_DELETE_FAILED: {
    code: 'USR_005',
    message: 'Failed to delete user.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  USERS_EMAIL_DUPLICATE: {
    code: 'USR_006',
    message: 'Email already exists.',
    status: HttpStatus.CONFLICT,
  },
};
