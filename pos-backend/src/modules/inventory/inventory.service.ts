import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoryService implements OnModuleInit {
  constructor(
    @InjectModel(Inventory.name) private readonly inventoryModel: Model<Inventory>,
  ) {}

  async onModuleInit() {
    try {
      await this.inventoryModel.createCollection();
    } catch {
      // collection may already exist
    }
  }

  async create(createInventoryDto: CreateInventoryDto) {
    return this.inventoryModel.create(createInventoryDto);
  }

  async findAll() {
    return this.inventoryModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    return this.inventoryModel.findById(id);
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryModel.findByIdAndUpdate(id, updateInventoryDto, {
      new: true,
    });
  }

  async remove(id: string) {
    return this.inventoryModel.findByIdAndDelete(id);
  }
}
