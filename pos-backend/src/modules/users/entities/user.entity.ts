import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
	@Prop({ required: true, trim: true })
	name!: string;

	@Prop({ required: true, unique: true, lowercase: true, trim: true })
	email!: string;

	@Prop({ required: false, select: false })
	password?: string;

	@Prop({ required: true, default: 'staff' })
	role!: string;

	@Prop({ type: [String], default: [] })
	permissions!: string[];

	@Prop({ default: true })
	isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

