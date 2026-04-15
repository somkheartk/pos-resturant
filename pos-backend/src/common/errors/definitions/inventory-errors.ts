import { HttpStatus } from '@nestjs/common';
import { ApiErrorDefinition } from '../api-error.constants';

export const INVENTORY_ERROR_MAP: Record<string, ApiErrorDefinition> = {
  INVENTORY_CREATE_FAILED: {
    code: 'INV_001',
    message: 'Failed to create inventory.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  INVENTORY_LIST_FAILED: {
    code: 'INV_002',
    message: 'Failed to fetch inventory list.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  INVENTORY_GET_FAILED: {
    code: 'INV_003',
    message: 'Failed to fetch inventory by id.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  INVENTORY_UPDATE_FAILED: {
    code: 'INV_004',
    message: 'Failed to update inventory.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  INVENTORY_DELETE_FAILED: {
    code: 'INV_005',
    message: 'Failed to delete inventory.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};
