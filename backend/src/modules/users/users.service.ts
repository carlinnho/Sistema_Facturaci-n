import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Shape del usuario devuelto por el SP tras la creación
export interface UsuarioCreado {
  id: number;
  nombres: string;
  apellidos: string;
  id_rol: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateUserDto): Promise<UsuarioCreado> {
    try {
      const rows = await this.db.query<UsuarioCreado>(
        'CALL sp_crear_usuario(?, ?, ?, ?)',
        [dto.nombres, dto.apellidos, dto.pin ?? null, dto.id_rol],
      );

      const usuarioCreado = rows[0];
      this.logger.log(
        `Usuario creado exitosamente con ID: ${usuarioCreado.id}`,
      );

      return usuarioCreado;
    } catch (err: any) {
      const mensaje: string = err?.message ?? '';

      if (mensaje.includes('ERR_ROL_INVALIDO')) {
        throw new ConflictException('El rol especificado no es válido.');
      }

      if (mensaje.includes('ERR_PIN_REQUERIDO')) {
        throw new ConflictException(
          'El PIN es obligatorio para el rol Administrador.',
        );
      }

      // Capturamos específicamente errores generados por SIGNAL SQLSTATE '45000'
      if (err.sqlState === '45000') {
        throw new ConflictException(mensaje);
      }

      this.logger.error('Error al crear usuario en BD:', err);
      throw new InternalServerErrorException(
        'No se pudo crear el usuario. Intente más tarde.',
      );
    }
  }

  async findAll() {
    try {
      const rows = await this.db.query('CALL sp_listar_perfiles()');
      return rows;
    } catch (error) {
      this.logger.error('Error al listar usuarios', error);
      throw new InternalServerErrorException(
        'Error al obtener la lista de usuarios',
      );
    }
  }

  async update(id: number, dto: UpdateUserDto) {
    try {
      const rows = await this.db.query(
        'CALL sp_actualizar_usuario(?, ?, ?, ?, ?)',
        [id, dto.nombres, dto.apellidos, dto.pin ?? null, dto.id_rol],
      );
      return rows[0];
    } catch (err: any) {
      this.handleDbErrors(err);
    }
  }

  async remove(id: number) {
    try {
      await this.db.query('CALL sp_eliminar_usuario(?)', [id]);
      return { message: 'Usuario eliminado correctamente' };
    } catch (err: any) {
      this.handleDbErrors(err);
    }
  }

  private handleDbErrors(err: any) {
    const mensaje: string = err?.message ?? '';
    if (err.sqlState === '45000') {
      throw new ConflictException(mensaje);
    }
    this.logger.error('Error de base de datos:', err);
    throw new InternalServerErrorException('Error interno del servidor.');
  }
}
