import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getAppHealth() {
    return {
      status: 'ok',
      service: 'pos-backend',
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseHealth() {
    const db = this.connection.db;

    if (!db) {
      throw new ServiceUnavailableException({
        errorCode: 'DB_503',
        message: 'Database is not connected.',
      });
    }

    let pingResult: { ok: number };
    try {
      pingResult = (await db.admin().ping()) as { ok: number };
    } catch {
      throw new ServiceUnavailableException({
        errorCode: 'DB_503',
        message: 'Database ping failed.',
      });
    }

    return {
      status: 'ok',
      database: 'up',
      ping: pingResult.ok === 1,
    };
  }
}
