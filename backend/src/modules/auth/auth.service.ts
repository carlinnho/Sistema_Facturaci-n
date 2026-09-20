import { Injectable, UnauthorizedException, Logger, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';

export interface CredencialesEmpresa {
  id: number;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  email_login: string;
  password_hash: string;
}

export interface Perfil {
  id: number;
  nombres: string;
  apellidos: string;
  id_rol: number;
  rol: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  // ── PASO 1: LOGIN DE EMPRESA ─────────────────────────────────────────────
  async loginEmpresa(email: string, password: string): Promise<{ access_token: string }> {
    const rows = await this.db.query<CredencialesEmpresa>(
      'CALL sp_validar_login_empresa(?)',
      [email],
    );

    const empresa = rows[0];

    if (!empresa) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordValida = await bcrypt.compare(password, empresa.password_hash);

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const payload = {
      tipo: 'empresa',
      sub: empresa.id,
    };

    this.logger.log(`Login de empresa exitoso — ID: ${empresa.id}`);

    return { access_token: this.jwtService.sign(payload) };
  }

  // ── PASO 2: LISTAR PERFILES ──────────────────────────────────────────────
  async listarPerfiles(): Promise<Perfil[]> {
    return this.db.query<Perfil>('CALL sp_listar_perfiles()');
  }

  // ── PASO 3: LOGIN DE PERFIL ──────────────────────────────────────────────
  async loginPerfil(id_usuario: number, pin?: string): Promise<{ access_token: string }> {
    try {
      const rows = await this.db.query<Perfil>(
        'CALL sp_login_perfil(?, ?)',
        [id_usuario, pin || null],
      );

      const perfil = rows[0];

      if (!perfil) {
         throw new UnauthorizedException('Perfil no encontrado tras validación.');
      }

      const payload = {
        tipo: 'perfil',
        sub: perfil.id,
        rol: perfil.id_rol,
        nombre: `${perfil.nombres} ${perfil.apellidos}`,
      };

      this.logger.log(`Login de perfil exitoso — Usuario ID: ${perfil.id}`);

      return { access_token: this.jwtService.sign(payload) };
    } catch (err: any) {
      const mensaje: string = err?.message ?? '';

      if (err.sqlState === '45000') {
         if (mensaje.includes('ERR_PIN_INCORRECTO')) {
           throw new UnauthorizedException('El PIN ingresado es incorrecto.');
         }
         throw new UnauthorizedException(mensaje);
      }
      throw err;
    }
  }
}