import { HttpStatus } from '@nestjs/common';
import { ApiErrorDefinition } from '../api-error.constants';

export const PRODUCTS_ERROR_MAP: Record<string, ApiErrorDefinition> = {
  PRODUCTS_CREATE_FAILED: {
    code: 'PRD_001',
    message: 'Failed to create product.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  PRODUCTS_LIST_FAILED: {
    code: 'PRD_002',
    message: 'Failed to fetch product list.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  PRODUCTS_GET_FAILED: {
    code: 'PRD_003',
    message: 'Failed to fetch product by id.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  PRODUCTS_UPDATE_FAILED: {
    code: 'PRD_004',
    message: 'Failed to update product.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  PRODUCTS_DELETE_FAILED: {
    code: 'PRD_005',
    message: 'Failed to delete product.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};
