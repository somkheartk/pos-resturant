import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(@InjectModel(Order.name) private readonly orderModel: Model<Order>) {}

  private buildOrderNo() {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `SO-${year}${month}${day}-${suffix}`;
  }

  private normalizeItems(items?: CreateOrderItemDto[]) {
    const normalizedItems = (items ?? [])
      .map((item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const productName = item.productName?.trim();

        if (!productName || !Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) {
          return null;
        }

        return {
		  productId: item.productId?.trim() || undefined,
          productName,
          quantity,
          unitPrice,
          lineTotal: quantity * unitPrice,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return normalizedItems;
  }

  private normalizeOrderPayload(orderDto: CreateOrderDto | UpdateOrderDto) {
    const items = this.normalizeItems(orderDto.items);
    const computedTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const fallbackTotal = Number(orderDto.totalAmount ?? 0);
    const totalAmount = items.length > 0 ? computedTotal : Math.max(fallbackTotal, 0);
    const computedItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const fallbackItemCount = Number(orderDto.itemCount ?? 1);

    return {
      ...orderDto,
      orderNo: orderDto.orderNo?.trim() || undefined,
      customerName: orderDto.customerName?.trim(),
      branchName: orderDto.branchName?.trim() || 'Main Branch',
      totalAmount,
      paymentMethod: orderDto.paymentMethod?.trim() || 'cash',
      itemCount: items.length > 0 ? computedItemCount : Math.max(fallbackItemCount, 1),
      items,
      note: orderDto.note?.trim() || undefined,
      status: orderDto.status?.trim() || 'pending',
    };
  }

  async onModuleInit() {
    try {
      await this.orderModel.createCollection();
    } catch {
      // collection may already exist
    }
  }

  async create(createOrderDto: CreateOrderDto) {
    return this.orderModel.create({
      ...this.normalizeOrderPayload(createOrderDto),
      orderNo: createOrderDto.orderNo?.trim() || this.buildOrderNo(),
    });
  }

  async findAll() {
    return this.orderModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    return this.orderModel.findById(id);
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    return this.orderModel.findByIdAndUpdate(id, this.normalizeOrderPayload(updateOrderDto), { new: true });
  }

  async remove(id: string) {
    return this.orderModel.findByIdAndDelete(id);
  }
}
