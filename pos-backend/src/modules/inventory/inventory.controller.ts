import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { throwApiError } from '../../common/errors/api-error.util';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    try {
      return await Promise.resolve(
        this.inventoryService.create(createInventoryDto),
      );
    } catch (error) {
      throwApiError('INVENTORY_CREATE_FAILED', error);
    }
  }

  @Get()
  async findAll() {
    try {
      return await Promise.resolve(this.inventoryService.findAll());
    } catch (error) {
      throwApiError('INVENTORY_LIST_FAILED', error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await Promise.resolve(this.inventoryService.findOne(id));
    } catch (error) {
      throwApiError('INVENTORY_GET_FAILED', error);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    try {
      return await Promise.resolve(
        this.inventoryService.update(id, updateInventoryDto),
      );
    } catch (error) {
      throwApiError('INVENTORY_UPDATE_FAILED', error);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await Promise.resolve(this.inventoryService.remove(id));
    } catch (error) {
      throwApiError('INVENTORY_DELETE_FAILED', error);
    }
  }
}
