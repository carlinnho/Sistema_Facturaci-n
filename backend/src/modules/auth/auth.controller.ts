import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginEmpresaDto } from './dto/login-empresa.dto';
import { LoginPerfilDto } from './dto/login-perfil.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /auth/login-empresa ────────────────────────────────────────────
  @Post('login-empresa')
  @HttpCode(HttpStatus.OK)
  async loginEmpresa(@Body() body: LoginEmpresaDto) {
    return this.authService.loginEmpresa(body.email, body.password);
  }

  // ── GET /auth/perfiles ──────────────────────────────────────────────────
  @Get('perfiles')
  @UseGuards(JwtAuthGuard)
  async listarPerfiles() {
    return this.authService.listarPerfiles();
  }

  // ── POST /auth/login-perfil ─────────────────────────────────────────────
  @Post('login-perfil')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async loginPerfil(@Body() body: LoginPerfilDto) {
    return this.authService.loginPerfil(body.id_usuario, body.pin);
  }

  // ── POST /auth/logout ───────────────────────────────────────────────────
  // JWT es stateless: el servidor no puede invalidar tokens activos.
  // La responsabilidad del logout recae en el CLIENTE (borrar el token del storage).
  // El guard protege el endpoint para asegurarse de que solo usuarios
  // autenticados puedan llamarlo (buena práctica de UX y auditoría).
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@Request() req: any) {
    this.logoutLog(req.user?.id);
    return {
      message: 'Logout exitoso. Elimine el token en el cliente.',
    };
  }

  private logoutLog(userId?: number): void {
    if (userId) {
      // Punto de extensión: aquí podrías emitir un evento de auditoría
      // o escribir en una tabla `sesiones_log` en el futuro
    }
  }
}