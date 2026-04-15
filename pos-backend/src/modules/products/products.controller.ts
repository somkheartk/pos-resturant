import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { throwApiError } from '../../common/errors/api-error.util';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      return await Promise.resolve(this.productsService.create(createProductDto));
    } catch (error) {
      throwApiError('PRODUCTS_CREATE_FAILED', error);
    }
  }

  @Get()
  async findAll() {
    try {
      return await Promise.resolve(this.productsService.findAll());
    } catch (error) {
      throwApiError('PRODUCTS_LIST_FAILED', error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await Promise.resolve(this.productsService.findOne(id));
    } catch (error) {
      throwApiError('PRODUCTS_GET_FAILED', error);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    try {
      return await Promise.resolve(this.productsService.update(id, updateProductDto));
    } catch (error) {
      throwApiError('PRODUCTS_UPDATE_FAILED', error);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await Promise.resolve(this.productsService.remove(id));
    } catch (error) {
      throwApiError('PRODUCTS_DELETE_FAILED', error);
    }
  }
}
