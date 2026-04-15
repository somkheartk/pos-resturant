import {
	IsArray,
	IsBoolean,
	IsEmail,
	IsOptional,
	IsString,
	MinLength,
} from 'class-validator';

export class CreateUserDto {
	@IsString()
	@MinLength(2)
	name: string;

	@IsEmail()
	email: string;

	@IsOptional()
	@IsString()
	@MinLength(6)
	password?: string;

	@IsOptional()
	@IsString()
	role?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	permissions?: string[];
}

