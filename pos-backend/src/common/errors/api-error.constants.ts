import { HttpStatus } from '@nestjs/common';
import { AUTH_ERROR_MAP } from './definitions/auth-errors';
import { INVENTORY_ERROR_MAP } from './definitions/inventory-errors';
import { ORDERS_ERROR_MAP } from './definitions/orders-errors';
import { PRODUCTS_ERROR_MAP } from './definitions/products-errors';
import { USERS_ERROR_MAP } from './definitions/users-errors';

export interface ApiErrorDefinition {
  code: string;
  message: string;
  status: HttpStatus;
}

export const API_ERROR_MAP = {
  ...AUTH_ERROR_MAP,
  ...INVENTORY_ERROR_MAP,
  ...ORDERS_ERROR_MAP,
  ...PRODUCTS_ERROR_MAP,
  ...USERS_ERROR_MAP,
};

export type ApiErrorKey = keyof typeof API_ERROR_MAP;
