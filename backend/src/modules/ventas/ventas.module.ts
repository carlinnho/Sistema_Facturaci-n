import { Module } from '@nestjs/common';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';
import { DatabaseModule } from '../database/database.module';
import { SunatModule } from '../sunat/sunat.module';

@Module({
  imports: [DatabaseModule, SunatModule],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
