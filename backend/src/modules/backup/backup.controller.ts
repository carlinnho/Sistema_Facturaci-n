import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { BackupService } from './backup.service';
import express from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('historial')
  @Roles(1)
  async getHistorial() {
    const data = await this.backupService.listarHistorial();
    return { statusCode: 200, data };
  }

  @Post('crear')
  @Roles(1)
  async crearBackup() {
    await this.backupService.generarBackup();
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Respaldo generado y guardado en el historial.',
    };
  }

  @Get('descargar/:id')
  @Roles(1)
  async descargarBackup(@Param('id') id: string, @Res() res: express.Response) {
    const filePath = await this.backupService.obtenerRutaArchivo(+id);
    res.download(filePath);
  }
}
