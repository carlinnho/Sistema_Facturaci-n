import { Module } from '@nestjs/common';
import { MediosPagoController } from './medios-pago.controller';
import { MediosPagoService } from './medios-pago.service';

@Module({
  controllers: [MediosPagoController],
  providers: [MediosPagoService],
})
export class MediosPagoModule {}
