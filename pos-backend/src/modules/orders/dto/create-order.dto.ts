import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CreateOrderItemDto {
	@IsOptional()
	@IsString()
	productId?: string;

	@IsString()
	productName!: string;

	@IsNumber()
	@Min(1)
	quantity!: number;

	@IsNumber()
	@Min(0)
	unitPrice!: number;
}

export class CreateOrderDto {
	@IsOptional()
	@IsString()
	orderNo?: string;

	@IsString()
	customerName!: string;

	@IsOptional()
	@IsString()
	branchName?: string;

	@IsNumber()
	@Min(0)
	totalAmount!: number;

	@IsOptional()
	@IsString()
	paymentMethod?: string;

	@IsOptional()
	@IsNumber()
	@Min(1)
	itemCount?: number;

	@IsOptional()
	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => CreateOrderItemDto)
	items?: CreateOrderItemDto[];

	@IsOptional()
	@IsString()
	note?: string;

	@IsString()
	status!: string;
}

