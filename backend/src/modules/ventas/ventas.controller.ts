import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  // ── GET /ventas/siguiente-ticket ──────────────────────────────────────────
  /**
   * Obtiene el próximo ID autoincremental de la tabla ventas para mostrar
   * en el ticket del frontend antes de realizar la compra.
   */
  @Get('siguiente-ticket')
  @Roles(1, 2)
  async obtenerSiguienteTicket() {
    const siguienteTicket = await this.ventasService.obtenerSiguienteTicket();

    return {
      statusCode: HttpStatus.OK,
      message: 'Siguiente número de ticket obtenido.',
      data: { siguiente_ticket: siguienteTicket },
    };
  }

  // ── POST /ventas ──────────────────────────────────────────────────────────
  @Post()
  @Roles(1, 2)
  @HttpCode(HttpStatus.CREATED)
  async crearVenta(
    @Body() createVentaDto: CreateVentaDto,
    @Request() req: any,
  ) {
    console.log('Datos extraídos del Token (req.user):', req.user);
    const idUsuario =
      req.user.id || req.user.userId || req.user.sub || req.user.id_usuario;
    if (!idUsuario) {
      throw new BadRequestException(
        'No se pudo identificar al usuario desde el token JWT.',
      );
    }
    const resultado = await this.ventasService.crearVenta(
      createVentaDto,
      idUsuario,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Venta registrada exitosamente.',
      data: resultado,
    };
  }

  // ── GET /ventas/cliente/DNI/12345678 ─────────────────────────────────────
  @Get('cliente/:tipo/:documento')
  @Roles(1, 2)
  async buscarCliente(
    @Param('tipo') tipo: string,
    @Param('documento') documento: string,
  ) {
    const tipoNormalizado = tipo.toUpperCase();

    if (tipoNormalizado !== 'DNI' && tipoNormalizado !== 'RUC') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El tipo debe ser DNI o RUC.',
      };
    }

    const cliente = await this.ventasService.buscarCliente(
      tipoNormalizado as 'DNI' | 'RUC',
      documento,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Datos del cliente encontrados.`,
      data: cliente,
    };
  }
}
