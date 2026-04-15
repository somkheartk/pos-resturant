import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

type FindUsersParams = {
  page: number;
  pageSize: number;
  search?: string;
  user?: string;
  email?: string;
  role?: string;
  status?: string;
};

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async onModuleInit() {
    try {
      await this.userModel.createCollection();
    } catch {
      // collection may already exist
    }
  }

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.password) {
      createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    }
    return this.userModel.create(createUserDto);
  }

  async findAll() {
    return this.userModel.find().sort({ createdAt: -1 });
  }

  async findPaged(params: FindUsersParams) {
    const page = Math.max(params.page, 1);
    const pageSize = Math.min(Math.max(params.pageSize, 1), 100);
    const search = params.search?.trim();
    const user = params.user?.trim();
    const email = params.email?.trim();
    const role = params.role?.trim().toLowerCase();
    const status = params.status?.trim().toLowerCase();

    const andFilter: Record<string, unknown>[] = [];

    if (search) {
      andFilter.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (user) {
      andFilter.push({ name: { $regex: user, $options: 'i' } });
    }

    if (email) {
      andFilter.push({ email: { $regex: email, $options: 'i' } });
    }

    if (role) {
      andFilter.push({ role });
    }

    if (status === 'active') {
      andFilter.push({ isActive: true });
    }

    if (status === 'inactive') {
      andFilter.push({ isActive: false });
    }

    const filter = andFilter.length > 0 ? { $and: andFilter } : {};

    const total = await this.userModel.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * pageSize;

    const data = await this.userModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return {
      data,
      meta: {
        page: safePage,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    return this.userModel.findById(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
