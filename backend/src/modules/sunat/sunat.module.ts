import { Module } from '@nestjs/common';
import { SunatService } from './sunat.service';

@Module({
  providers: [SunatService],
  exports: [SunatService], // Lo exportamos para poder usarlo desde el VentasService
})
export class SunatModule {}
