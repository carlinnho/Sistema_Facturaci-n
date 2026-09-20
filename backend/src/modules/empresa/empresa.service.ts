import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmpresaService {
  private readonly logger = new Logger(EmpresaService.name);

  constructor(private readonly db: DatabaseService) {}

  async obtener() {
    try {
      const rows = await this.db.query('CALL sp_obtener_empresa()');
      return rows[0];
    } catch (error) {
      this.logger.error('Error al obtener empresa', error);
      throw new InternalServerErrorException(
        'Error al obtener los datos de la empresa',
      );
    }
  }

  async actualizar(dto: UpdateEmpresaDto) {
    try {
      // 1. Obtenemos los datos actuales de la empresa
      const actual = await this.obtener();

      let passwordHash: string | null = null;

      // 2. Si hay un password nuevo, lo encriptamos
      if (dto.password && dto.password.trim() !== '') {
        passwordHash = await bcrypt.hash(dto.password, 10);
      }

      // 3. Mezclamos los datos: si el DTO no trae el campo, usamos el 'actual'
      const rows = await this.db.query(
        'CALL sp_actualizar_empresa(?, ?, ?, ?, ?, ?, ?, ?)',
        [
          dto.ruc ?? actual.ruc,
          dto.razon_social ?? actual.razon_social,
          dto.nombre_comercial ?? actual.nombre_comercial,
          dto.direccion ?? actual.direccion,
          dto.telefono ?? actual.telefono,
          dto.email_login ?? actual.email_login,
          passwordHash, // Si es null, el Stored Procedure conserva la antigua (COALESCE)
          dto.logo_url ?? actual.logo_url, // Si es null, el Stored Procedure conserva el logo antiguo
        ],
      );

      return rows[0];
    } catch (error) {
      this.logger.error('Error al actualizar empresa', error);
      throw new InternalServerErrorException(
        'Error al actualizar los datos de la empresa',
      );
    }
  }
}
