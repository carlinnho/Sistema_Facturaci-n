import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedore.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  @Roles(1) // Solo Administradores
  async create(@Body() createProveedorDto: CreateProveedorDto) {
    const data = await this.proveedoresService.crear(createProveedorDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Proveedor creado',
      data,
    };
  }

  @Get()
  @Roles(1, 2) // Administradores y Trabajadores (por si necesitan ver lista)
  async findAll() {
    const data = await this.proveedoresService.listar();
    return { statusCode: HttpStatus.OK, message: 'Lista de proveedores', data };
  }

  @Patch(':id')
  @Roles(1) // Solo Administradores
  async update(
    @Param('id') id: string,
    @Body() updateProveedorDto: UpdateProveedorDto,
  ) {
    const data = await this.proveedoresService.actualizar(
      +id,
      updateProveedorDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Proveedor actualizado',
      data,
    };
  }

  @Delete(':id')
  @Roles(1) // Solo Administradores
  async remove(@Param('id') id: string) {
    const data = await this.proveedoresService.eliminar(+id);
    return { statusCode: HttpStatus.OK, message: 'Proveedor eliminado', data };
  }
}
