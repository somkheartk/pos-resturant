import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { throwApiError } from '../../common/errors/api-error.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginAuthDto: LoginAuthDto) {
    try {
      return await this.authService.login(loginAuthDto);
    } catch (error) {
      throwApiError('AUTH_LOGIN_FAILED', error);
    }
  }

  @Post()
  async create(@Body() createAuthDto: CreateAuthDto) {
    try {
      return await Promise.resolve(this.authService.create(createAuthDto));
    } catch (error) {
      throwApiError('AUTH_CREATE_FAILED', error);
    }
  }

  @Get()
  async findAll() {
    try {
      return await Promise.resolve(this.authService.findAll());
    } catch (error) {
      throwApiError('AUTH_LIST_FAILED', error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await Promise.resolve(this.authService.findOne(id));
    } catch (error) {
      throwApiError('AUTH_GET_FAILED', error);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    try {
      return await Promise.resolve(this.authService.update(id, updateAuthDto));
    } catch (error) {
      throwApiError('AUTH_UPDATE_FAILED', error);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await Promise.resolve(this.authService.remove(id));
    } catch (error) {
      throwApiError('AUTH_DELETE_FAILED', error);
    }
  }
}
