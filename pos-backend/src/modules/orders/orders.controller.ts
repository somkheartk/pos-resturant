import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { throwApiError } from '../../common/errors/api-error.util';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      return await Promise.resolve(this.ordersService.create(createOrderDto));
    } catch (error) {
      throwApiError('ORDERS_CREATE_FAILED', error);
    }
  }

  @Get()
  async findAll() {
    try {
      return await Promise.resolve(this.ordersService.findAll());
    } catch (error) {
      throwApiError('ORDERS_LIST_FAILED', error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await Promise.resolve(this.ordersService.findOne(id));
    } catch (error) {
      throwApiError('ORDERS_GET_FAILED', error);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    try {
      return await Promise.resolve(
        this.ordersService.update(id, updateOrderDto),
      );
    } catch (error) {
      throwApiError('ORDERS_UPDATE_FAILED', error);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await Promise.resolve(this.ordersService.remove(id));
    } catch (error) {
      throwApiError('ORDERS_DELETE_FAILED', error);
    }
  }
}
