import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedore.dto';

@Injectable()
export class ProveedoresService {
  private readonly logger = new Logger(ProveedoresService.name);

  constructor(private readonly db: DatabaseService) {}

  async crear(dto: CreateProveedorDto) {
    try {
      const rows = await this.db.query(
        'CALL sp_crear_proveedor(?, ?, ?, ?, ?)',
        [
          dto.nombre,
          dto.descripcion ?? null,
          dto.telefono_whatsapp ?? null,
          dto.telefono_fijo ?? null,
          dto.correo ?? null,
        ],
      );
      return rows[0];
    } catch (err: any) {
      this.logger.error('Error al crear proveedor', err);
      throw new InternalServerErrorException(
        'Error interno al crear el proveedor.',
      );
    }
  }

  async listar() {
    try {
      const rows = await this.db.query('CALL sp_listar_proveedores()', []);
      return rows;
    } catch (err: any) {
      this.logger.error('Error al listar proveedores', err);
      throw new InternalServerErrorException(
        'Error interno al listar proveedores.',
      );
    }
  }

  async actualizar(id: number, dto: UpdateProveedorDto) {
    try {
      const rows = await this.db.query(
        'CALL sp_actualizar_proveedor(?, ?, ?, ?, ?, ?)',
        [
          id,
          dto.nombre ?? null,
          dto.descripcion ?? null,
          dto.telefono_whatsapp ?? null,
          dto.telefono_fijo ?? null,
          dto.correo ?? null,
        ],
      );
      return rows[0];
    } catch (err: any) {
      if (err.sqlState === '45000') {
        throw new NotFoundException(err.message);
      }
      this.logger.error(`Error al actualizar proveedor ${id}`, err);
      throw new InternalServerErrorException(
        'Error interno al actualizar el proveedor.',
      );
    }
  }

  async eliminar(id: number) {
    try {
      await this.db.query('CALL sp_eliminar_proveedor(?)', [id]);
      return {
        message: `Proveedor ${id} eliminado (borrado lógico) exitosamente.`,
      };
    } catch (err: any) {
      if (err.sqlState === '45000') {
        throw new NotFoundException(err.message);
      }
      this.logger.error(`Error al eliminar proveedor ${id}`, err);
      throw new InternalServerErrorException(
        'Error interno al eliminar el proveedor.',
      );
    }
  }
}
