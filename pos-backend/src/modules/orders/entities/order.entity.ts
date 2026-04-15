import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
	@Prop({ required: false, trim: true })
	productId?: string;

	@Prop({ required: true, trim: true })
	productName: string;

	@Prop({ required: true, min: 1 })
	quantity: number;

	@Prop({ required: true, min: 0 })
	unitPrice: number;

	@Prop({ required: true, min: 0 })
	lineTotal: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
	@Prop({ required: false, trim: true, unique: true, sparse: true })
	orderNo?: string;

	@Prop({ required: true, trim: true })
	customerName: string;

	@Prop({ required: true, trim: true, default: 'Main Branch' })
	branchName: string;

	@Prop({ required: true, min: 0 })
	totalAmount: number;

	@Prop({ required: true, trim: true, default: 'cash' })
	paymentMethod: string;

	@Prop({ required: true, min: 1, default: 1 })
	itemCount: number;

	@Prop({ type: [OrderItemSchema], default: [] })
	items: OrderItem[];

	@Prop({ required: false, trim: true })
	note?: string;

	@Prop({ required: true, default: 'pending' })
	status: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

