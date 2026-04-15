import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { throwApiError } from '../../common/errors/api-error.util';
import { User } from '../users/entities/user.entity';

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: '1d';
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

function resolvePermissionsByRole(role: string): string[] {
  const allPermissions = [
    'dashboard:view',
    'admin:settings',
    'users:view',
    'branches:view',
    'orders:view',
    'inventory:view',
    'po:view',
    'products:view',
    'category:view',
  ];

  if (role === 'admin') {
    return allPermissions;
  }

  if (role === 'manager') {
    return [
      'dashboard:view',
      'branches:view',
      'orders:view',
      'inventory:view',
      'po:view',
      'products:view',
      'category:view',
    ];
  }

  return ['dashboard:view', 'orders:view', 'inventory:view'];
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async onModuleInit() {
    try {
      await this.userModel.createCollection();
    } catch {
      // collection may already exist
    }

    const admin = await this.userModel.findOne({ email: 'admin@pos.local' });
    if (!admin) {
      const hashed = await bcrypt.hash('123456', 10);
      await this.userModel.create({
        name: 'System Admin',
        email: 'admin@pos.local',
        password: hashed,
        role: 'admin',
        isActive: true,
      });
    }
  }

  async login(loginAuthDto: LoginAuthDto): Promise<LoginResponse> {
    const user = await this.userModel
      .findOne({ email: loginAuthDto.email })
      .select('+password');

    let passwordMatch = false;

    if (user?.password) {
      const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password);

      if (isBcryptHash) {
        passwordMatch = await bcrypt.compare(loginAuthDto.password, user.password);
      } else {
        // Backward compatibility: accept legacy plaintext and migrate immediately.
        passwordMatch = user.password === loginAuthDto.password;
        if (passwordMatch && user._id) {
          const migratedHash = await bcrypt.hash(loginAuthDto.password, 10);
          await this.userModel.updateOne(
            { _id: user._id },
            { $set: { password: migratedHash } },
          );
        }
      }
    }

    if (!user || !passwordMatch || !user._id || user.isActive === false) {
      throwApiError('AUTH_INVALID_CREDENTIALS');
    }

    const rolePermissions = resolvePermissionsByRole(user.role);
    const customPermissions = Array.isArray(user.permissions)
      ? user.permissions.filter(
          (permission): permission is string => typeof permission === 'string',
        )
      : [];
    const permissions = Array.from(new Set([...rolePermissions, ...customPermissions]));

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: '1d',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        permissions,
      },
    };
  }

  async create(createAuthDto: CreateAuthDto) {
    const hashed = createAuthDto.password
      ? await bcrypt.hash(createAuthDto.password, 10)
      : undefined;
    return this.userModel.create({
      name: createAuthDto.name ?? createAuthDto.email.split('@')[0],
      email: createAuthDto.email,
      password: hashed,
      role: createAuthDto.role ?? 'staff',
      isActive: true,
    });
  }

  async findAll() {
    return this.userModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    return this.userModel.findById(id);
  }

  async update(id: string, updateAuthDto: UpdateAuthDto) {
    if (updateAuthDto.password) {
      updateAuthDto.password = await bcrypt.hash(updateAuthDto.password, 10);
    }
    return this.userModel.findByIdAndUpdate(id, updateAuthDto, { new: true });
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
