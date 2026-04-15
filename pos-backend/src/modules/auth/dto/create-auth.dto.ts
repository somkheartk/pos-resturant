import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAuthDto {
	@IsOptional()
	@IsString()
	@MinLength(2)
	name?: string;

	@IsEmail()
	email!: string;

	@IsString()
	@MinLength(6)
	password!: string;

	@IsOptional()
	@IsString()
	role?: string;
}

