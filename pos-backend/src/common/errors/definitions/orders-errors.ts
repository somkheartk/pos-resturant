import { HttpStatus } from '@nestjs/common';
import { ApiErrorDefinition } from '../api-error.constants';

export const ORDERS_ERROR_MAP: Record<string, ApiErrorDefinition> = {
  ORDERS_CREATE_FAILED: {
    code: 'ORD_001',
    message: 'Failed to create order.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  ORDERS_LIST_FAILED: {
    code: 'ORD_002',
    message: 'Failed to fetch order list.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  ORDERS_GET_FAILED: {
    code: 'ORD_003',
    message: 'Failed to fetch order by id.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  ORDERS_UPDATE_FAILED: {
    code: 'ORD_004',
    message: 'Failed to update order.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  ORDERS_DELETE_FAILED: {
    code: 'ORD_005',
    message: 'Failed to delete order.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};
