import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({ timestamps: true, collection: 'inventory' })
export class Inventory {
	@Prop({ required: true, trim: true })
	sku: string;

	@Prop({ required: true, min: 0 })
	quantity: number;

	@Prop({ required: true, trim: true })
	location: string;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

