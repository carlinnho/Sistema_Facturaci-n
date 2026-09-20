import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  private readonly logger = new Logger(CategoriasService.name);

  constructor(private readonly db: DatabaseService) {}

  async crear(dto: CreateCategoriaDto) {
    try {
      const rows = await this.db.query('CALL sp_crear_categoria(?)', [
        dto.nombre,
      ]);
      // MariaDB devuelve [[resultSet], fieldPackets] al ejecutar un CALL
      return rows[0];
    } catch (err: any) {
      if (err.sqlState === '45000') {
        throw new ConflictException(
          err?.message ?? 'Error de validación en BD.',
        );
      }
      this.logger.error('CategoriasService.crear', err);
      throw new InternalServerErrorException('Error interno del servidor.');
    }
  }

  async listar() {
    try {
      const rows = await this.db.query('CALL sp_listar_categorias()', []);
      return rows; // Array de categorías
    } catch (err: any) {
      if (err.sqlState === '45000') {
        throw new ConflictException(
          err?.message ?? 'Error de validación en BD.',
        );
      }
      this.logger.error('CategoriasService.listar', err);
      throw new InternalServerErrorException('Error interno del servidor.');
    }
  }

  async actualizar(id: number, dto: UpdateCategoriaDto) {
    try {
      const rows = await this.db.query('CALL sp_actualizar_categoria(?, ?)', [
        id,
        dto.nombre,
      ]);
      const updated = rows[0];
      if (!updated) {
        throw new NotFoundException(`Categoría con id ${id} no encontrada.`);
      }
      return updated;
    } catch (err: any) {
      // Re-lanzar excepciones de NestJS sin envolver
      if (
        err instanceof NotFoundException ||
        err instanceof ConflictException
      ) {
        throw err;
      }
      if (err.sqlState === '45000') {
        throw new ConflictException(
          err?.message ?? 'Error de validación en BD.',
        );
      }
      this.logger.error('CategoriasService.actualizar', err);
      throw new InternalServerErrorException('Error interno del servidor.');
    }
  }

  async eliminar(id: number) {
    try {
      await this.db.query('CALL sp_eliminar_categoria(?)', [id]);
      return { message: `Categoría ${id} desactivada correctamente.` };
    } catch (err: any) {
      if (err.sqlState === '45000') {
        throw new ConflictException(
          err?.message ?? 'Error de validación en BD.',
        );
      }
      this.logger.error('CategoriasService.eliminar', err);
      throw new InternalServerErrorException('Error interno del servidor.');
    }
  }
}
