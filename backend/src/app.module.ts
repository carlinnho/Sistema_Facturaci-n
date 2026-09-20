import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { ProductosModule } from './modules/productos/productos.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { MediosPagoModule } from './modules/medios-pago/medios-pago.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { BackupModule } from './modules/backup/backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CategoriasModule,
    ProductosModule,
    EmpresaModule,
    VentasModule,
    MediosPagoModule,
    ProveedoresModule,
    ReportesModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
