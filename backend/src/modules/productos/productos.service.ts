import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { RestockMultipleDto } from './dto/restock.dto';

@Injectable()
export class ProductosService {
  private readonly logger = new Logger(ProductosService.name);

  constructor(private readonly db: DatabaseService) {}

  async crear(dto: CreateProductoDto) {
    try {
      const rows = await this.db.query(
        'CALL sp_crear_producto(?, ?, ?, ?, ?, ?)',
        [
          dto.nombre,
          dto.codigo_barras ?? null,
          dto.precio,
          dto.stock_minimo,
          dto.stock_actual,
          dto.id_categoria,
        ],
      );
      return rows[0];
    } catch (err: any) {
      if (err.sqlState === '45000') {
        throw new ConflictException(
          err?.message ?? 'Error de validación en BD.',
        );
      }
      this.logger.error('ProductosService.crear', err);
      throw new InternalServerErrorException('Error interno del servidor.');
    }
  }

  async listar() {
    try {
      const rows = await this.db.query('CALL sp_listar_productos()', []);
      return rows;
    } catch (err: any) {
      if (err.sqlState === '45000') {
        throw new ConflictException(
          err?.message ?? 'Error de validación en BD.',
        );
      }
      this.logger.error('ProductosService.listar', err);
      throw new InternalServerErrorException('Error interno del servidor.');
    }
  }

  async buscarPorBarras(codigoBarras: string) {
    try {
      const rows = await this.db.query(
        'CALL sp_buscar_producto_por_barras(?)',
        [codigoBarras],
      );
      const producto = rows[0];
      if (!producto) {
        throw new NotFoundException(
          `No se encontró ningún producto con el código de barras "${codigoBarras}".`,
        );
      }
      return producto;
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      if (err.sqlState === '45000') {
        throw new ConflictException(
          err?.message ?? 'Error de validación en BD.',
        );
      }
      this.logger.error('ProductosService.buscarPorBarras', err);
      throw new InternalServerErrorException('Error interno del servidor.');
    }
  }

  async actualizar(id: number, dto: UpdateProductoDto) {
    try {
      const rows = await this.db.query(
        'CALL sp_actualizar_producto(?, ?, ?, ?, ?, ?)',
        [
          id,
          dto.nombre,
          dto.codigo_barras ?? null,
          dto.precio,
          dto.stock_minimo,
          dto.id_categoria,
        ],
      );
      const updated = rows[0];
      if (!updated) {
        throw new NotFoundException(`Producto con id ${id} no encontrado.`);
      }
      return updated;
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      if (err.sqlState === '45000') {
        throw new ConflictException(
          err?.message ?? 'Error de validación en BD.',
        );
      }
      this.logger.error('ProductosService.actualizar', err);
      throw new InternalServerErrorException('Error interno del servidor.');
    }
  }

  /**
   * Reposición de stock para un único producto.
   * Reutilizado internamente por actualizarStockMultiple.
   */
  async actualizarStock(idProducto: number, cantidad: number) {
    try {
      const rows = await this.db.query('CALL sp_actualizar_stock(?, ?)', [
        idProducto,
        cantidad,
      ]);
      return rows[0];
    } catch (err: any) {
      if (err.sqlState === '45000') {
        throw new ConflictException(
          err?.message ??
            `Error al actualizar stock del producto ${idProducto}.`,
        );
      }
      this.logger.error(
        `ProductosService.actualizarStock id=${idProducto}`,
        err,
      );
      throw new InternalServerErrorException('Error interno del servidor.');
    }
  }

  /**
   * Reposición múltiple en paralelo.
   * Promise.all: falla-rápido si cualquier SP lanza SIGNAL 45000.
   * Si se necesita rollback por error parcial, envolver en transacción DB.
   */
  async actualizarStockMultiple(dto: RestockMultipleDto) {
    const resultados = await Promise.all(
      dto.items.map((item) =>
        this.actualizarStock(item.id_producto, item.cantidad),
      ),
    );
    return {
      message: `Stock actualizado para ${resultados.length} producto(s).`,
      resultados,
    };
  }

  async eliminar(id: number) {
    try {
      await this.db.query('CALL sp_eliminar_producto(?)', [id]);
      return { message: `Producto ${id} marcado como descontinuado.` };
    } catch (err: any) {
      if (err.sqlState === '45000') {
        throw new ConflictException(
          err?.message ?? 'Error de validación en BD.',
        );
      }
      this.logger.error('ProductosService.eliminar', err);
      throw new InternalServerErrorException('Error interno del servidor.');
    }
  }
}
