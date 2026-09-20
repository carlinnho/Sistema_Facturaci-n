import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly storagePath = path.join(process.cwd(), 'almacen_backups');

  constructor(private readonly db: DatabaseService) {
    // Crear la carpeta si no existe al iniciar el servicio
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath);
    }
  }

  async listarHistorial() {
    return await this.db.query(
      'SELECT * FROM historial_backups ORDER BY fecha_generacion DESC',
      [],
    );
  }

  async generarBackup(): Promise<void> {
    const dbName = 'facturacion_empresa';
    const dbUser = 'root';
    const dbPass = '';
    const timestamp = Date.now();
    const fileName = `Backup_BD_${timestamp}.sql`;
    const filePath = path.join(this.storagePath, fileName);

    try {
      const mysqlDumpPath = '"C:\\xampp\\mysql\\bin\\mysqldump.exe"';
      const cmd = `${mysqlDumpPath} -u ${dbUser} ${dbPass ? `-p${dbPass}` : ''} --routines --triggers --events ${dbName} > "${filePath}"`;

      await execAsync(cmd);

      // Calcular tamaño del archivo para el historial
      const stats = fs.statSync(filePath);
      const tamano = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';

      // Registrar en la base de datos
      await this.db.query(
        'INSERT INTO historial_backups (nombre_archivo, tamano) VALUES (?, ?)',
        [fileName, tamano],
      );
    } catch (error: any) {
      this.logger.error('Error generando backup', error.message);
      throw new InternalServerErrorException('No se pudo generar el respaldo.');
    }
  }

  async obtenerRutaArchivo(id: number): Promise<string> {
    const [registro] = await this.db.query(
      'SELECT nombre_archivo FROM historial_backups WHERE id = ?',
      [id],
    );
    if (!registro) throw new NotFoundException('Respaldo no encontrado.');

    const filePath = path.join(this.storagePath, registro.nombre_archivo);
    if (!fs.existsSync(filePath))
      throw new NotFoundException(
        'El archivo físico ya no existe en el servidor.',
      );

    return filePath;
  }
}
