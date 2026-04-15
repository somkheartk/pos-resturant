import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<Product>) {}

  async onModuleInit() {
    try {
      await this.productModel.createCollection();
    } catch {
      // collection may already exist
    }
  }

  async create(createProductDto: CreateProductDto) {
    return this.productModel.create(createProductDto);
  }

  async findAll() {
    return this.productModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    return this.productModel.findById(id);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return this.productModel.findByIdAndUpdate(id, updateProductDto, {
      new: true,
    });
  }

  async remove(id: string) {
    return this.productModel.findByIdAndDelete(id);
  }
}
