// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. ตั้ง Prefix ให้ API (เช่น /api/v1/products)
  app.setGlobalPrefix('api/v1');

  // 2. เปิด CORS ให้ Next.js และ Flutter เรียกใช้งานได้
  app.enableCors();

  // 3. ใช้ ValidationPipe เพื่อตรวจสอบ DTO อัตโนมัติ
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // เปิด Swagger เฉพาะตอน development เท่านั้น
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('POS Backend API')
      .setDescription('API documentation for POS backend')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, documentFactory);
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
