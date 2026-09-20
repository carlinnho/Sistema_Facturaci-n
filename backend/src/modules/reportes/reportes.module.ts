import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule], // ¡Asegúrate de agregar esto!
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
