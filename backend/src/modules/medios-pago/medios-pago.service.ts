import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MediosPagoService {
  constructor(private readonly db: DatabaseService) {}

  async listar() {
    const conn = await this.db.getConnection();
    try {
      const [rows] = await conn.query(
        'SELECT * FROM medios_pago ORDER BY id ASC',
      );
      return rows;
    } finally {
      conn.release();
    }
  }

  async actualizar(id: number, nombre: string, activo: number) {
    const conn = await this.db.getConnection();
    try {
      const [result]: any = await conn.query(
        'UPDATE medios_pago SET nombre = ?, activo = ? WHERE id = ?',
        [nombre, activo, id],
      );

      if (result.affectedRows === 0) {
        throw new NotFoundException(
          `Medio de pago con ID ${id} no encontrado.`,
        );
      }

      return { message: 'Medio de pago actualizado correctamente' };
    } finally {
      conn.release();
    }
  }
}
