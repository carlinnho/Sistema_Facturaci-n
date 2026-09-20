import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmpresaService } from './empresa.service';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Roles(1, 2)
  @Get()
  obtener() {
    return this.empresaService.obtener();
  }

  @Roles(1)
  @Patch() // <-- Cambiado a PATCH
  actualizar(@Body() dto: UpdateEmpresaDto) {
    return this.empresaService.actualizar(dto);
  }
}
