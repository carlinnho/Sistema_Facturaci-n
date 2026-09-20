import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard reutilizable para proteger cualquier ruta con JWT.
 * Uso: @UseGuards(JwtAuthGuard) sobre un controlador o método.
 *
 * Extender AuthGuard('jwt') en lugar de usarlo directamente
 * nos da un punto central para añadir lógica futura
 * (ej: logging, manejo de errores personalizado, roles).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}