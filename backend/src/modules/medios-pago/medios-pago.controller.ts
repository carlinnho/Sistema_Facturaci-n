import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { MediosPagoService } from './medios-pago.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medios-pago')
export class MediosPagoController {
  constructor(private readonly mediosPagoService: MediosPagoService) {}

  @Roles(1, 2) // Admin y Trabajador pueden verlos (para el POS)
  @Get()
  listar() {
    return this.mediosPagoService.listar();
  }

  @Roles(1) // SOLO Admin puede editarlos
  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body('nombre') nombre: string,
    @Body('activo') activo: number,
  ) {
    return this.mediosPagoService.actualizar(+id, nombre, activo);
  }
}
