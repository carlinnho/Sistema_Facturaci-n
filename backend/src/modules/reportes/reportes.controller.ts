import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // 1. JSON Historial
  @Get('historial')
  @Roles(1) // Solo Administradores
  async getHistorial() {
    const data = await this.reportesService.getHistorial();
    return { statusCode: 200, message: 'Historial de ventas', data };
  }

  // 2. JSON Dashboard
  @Get('dashboard')
  @Roles(1) // Solo Administradores
  async getDashboard() {
    const data = await this.reportesService.getDashboard();
    return { statusCode: 200, message: 'Datos del dashboard', data };
  }

  // 3. Exportar Excel Historial (Simple)
  @Get('historial/excel')
  @Roles(1)
  async exportHistorialExcel(@Res() res: Response) {
    const buffer = await this.reportesService.exportHistorialExcel();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="historial_ventas.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // 4. Exportar PDF Dashboard (Elegante)
  @Get('dashboard/pdf')
  @Roles(1)
  async exportDashboardPdf(@Res() res: Response) {
    const buffer = await this.reportesService.exportDashboardPdf();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="dashboard_reporte.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
