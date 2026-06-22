import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Медиафайлы на VPS хранятся локально — раздаём через /uploads.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const staticOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://socialnetworkfrontend-nine.vercel.app',
  ];
  // Vercel выдаёт уникальный URL на каждый деплой/превью (project-<hash>-<team>.vercel.app) —
  // разрешаем их все по шаблону, чтобы CORS не ломался при каждом новом деплое.
  const previewOriginPattern =
    /^https:\/\/socialnetworkfrontend-[a-z0-9-]+\.vercel\.app$/;

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        staticOrigins.includes(origin) ||
        previewOriginPattern.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const port = process.env.PORT || 4000;

  try {
    await app.listen(port);
    console.log(`Server running on http://localhost:${port}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use. Please free the port and try again.`,
      );
      process.exit(1);
    }
    throw error;
  }
}
void bootstrap();
