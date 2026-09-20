import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DatabaseService.name);
  private pool: mysql.Pool;

  onApplicationBootstrap(): void {
    this.pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'facturacion_empresa',
      waitForConnections: true,
      charset: 'utf8mb4_unicode_ci',
      connectionLimit: 10, // Máximo de conexiones simultáneas en el pool
      queueLimit: 0, // Sin límite en la cola de espera
      timezone: '+00:00',
    });

    this.logger.log('✅ Pool de conexiones MySQL inicializado.');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
    this.logger.log('🔌 Pool de conexiones MySQL cerrado.');
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const [results] = await this.pool.execute(sql, params);

    if (Array.isArray(results[0])) {
      return results[0] as T[];
    }

    return results as T[];
  }

  async getConnection() {
    return await this.pool.getConnection();
  }
}
