import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // 💡 SOLUTION CORS : Remplacer '*' par l'URL exacte de ton frontend (port 3001)
  app.enableCors({
    origin: 'http://localhost:3001', // Ton port frontend Next.js
    credentials: true,
  });

  // 💡 Écouter sur toutes les interfaces réseau (évite les bugs IPv6)
  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Backend NestJS prêt sur http://localhost:3000');
}
bootstrap();