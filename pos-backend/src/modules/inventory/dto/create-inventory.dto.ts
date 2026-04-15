import { IsNumber, IsString, Min } from 'class-validator';

export class CreateInventoryDto {
	@IsString()
	sku: string;

	@IsNumber()
	@Min(0)
	quantity: number;

	@IsString()
	location: string;
}

