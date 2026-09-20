import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Shape del payload firmado en AuthService.login()
interface JwtPayload {
  sub: number;
  email: string;
  rol: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extrae el token del header: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Rechaza automáticamente tokens expirados antes de llegar a validate()
      ignoreExpiration: false,
      secretOrKey: 'JWT_SECRET_DE_PRUEBA_CAMBIAR_EN_PRODUCCION',
    });
  }

  /**
   * Este método se ejecuta DESPUÉS de que Passport verifica la firma y expiración.
   * Lo que retorne aquí se inyecta en `request.user` en los controladores.
   * Si lanzas una excepción aquí, Passport retorna 401 automáticamente.
   */
  async validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Token inválido.');
    }

    // Retornamos solo lo necesario para no inflar request.user
    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}