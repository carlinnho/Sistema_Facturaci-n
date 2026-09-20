import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { RestockMultipleDto } from './dto/restock.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Roles(1)
  @Post()
  crear(@Body() dto: CreateProductoDto) {
    return this.productosService.crear(dto);
  }

  @Roles(1, 2)
  @Get()
  listar() {
    return this.productosService.listar();
  }

  /**
   * Endpoint para la pistola lectora de código de barras.
   * GET /productos/barras?codigo=7501234567890
   */
  @Roles(1, 2)
  @Get('barras')
  buscarPorBarras(@Query('codigo') codigo: string) {
    return this.productosService.buscarPorBarras(codigo);
  }

  @Roles(1)
  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productosService.actualizar(id, dto);
  }

  /**
   * PATCH /productos/stock/multiple
   * Debe declararse ANTES de :id para que NestJS no interprete
   * "stock" como un parámetro dinámico.
   */
  @Roles(1)
  @Patch('stock/multiple')
  actualizarStockMultiple(@Body() dto: RestockMultipleDto) {
    return this.productosService.actualizarStockMultiple(dto);
  }

  @Roles(1)
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.eliminar(id);
  }
}
