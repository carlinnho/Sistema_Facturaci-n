import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// 1. Importamos las utilidades de express
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para el frontend (Vite dev server en puerto 5173)
  app.enableCors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Activa las validaciones de los DTOs globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Ignora campos extra que envíe el cliente
      forbidNonWhitelisted: true, // Rechaza peticiones con campos no declarados en el DTO
    }),
  );

  // 2. Aumentamos el límite del Payload para aceptar imágenes en Base64
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
