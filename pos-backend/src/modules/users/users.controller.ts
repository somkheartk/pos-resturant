import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { throwApiError } from '../../common/errors/api-error.util';

function isDuplicateEmailError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const maybeError = error as {
    code?: number;
    keyPattern?: Record<string, unknown>;
    keyValue?: Record<string, unknown>;
  };

  if (maybeError.code !== 11000) {
    return false;
  }

  return Boolean(maybeError.keyPattern?.email || maybeError.keyValue?.email);
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      return await Promise.resolve(this.usersService.create(createUserDto));
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        throwApiError('USERS_EMAIL_DUPLICATE', error);
      }
      throwApiError('USERS_CREATE_FAILED', error);
    }
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('user') user?: string,
    @Query('email') email?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    try {
      if (page || pageSize || search || user || email || role || status) {
        return await Promise.resolve(
          this.usersService.findPaged({
            page: Number(page ?? 1),
            pageSize: Number(pageSize ?? 10),
            search,
            user,
            email,
            role,
            status,
          }),
        );
      }

      return await Promise.resolve(this.usersService.findAll());
    } catch (error) {
      throwApiError('USERS_LIST_FAILED', error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await Promise.resolve(this.usersService.findOne(id));
    } catch (error) {
      throwApiError('USERS_GET_FAILED', error);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      return await Promise.resolve(this.usersService.update(id, updateUserDto));
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        throwApiError('USERS_EMAIL_DUPLICATE', error);
      }
      throwApiError('USERS_UPDATE_FAILED', error);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await Promise.resolve(this.usersService.remove(id));
    } catch (error) {
      throwApiError('USERS_DELETE_FAILED', error);
    }
  }
}
