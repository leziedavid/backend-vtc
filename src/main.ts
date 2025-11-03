import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './utils/all-exceptions.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Création de l'application Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Récupérer ConfigService via app.get()
  const configService = app.get(ConfigService);

  // ----------------------------
  // Configuration globale
  // ----------------------------
  app.setGlobalPrefix('api/v1');

  // Dossier statique pour les uploads, via ConfigService
  const fileStoragePath = configService.get<string>('FILE_STORAGE_PATH') || '/app/uploads';
  app.useStaticAssets(join(fileStoragePath), {
    prefix: '/uploads/',
  });

  // ⚡ Indiquer à Express que l'app est derrière un proxy (Caddy)
  app.set('trust proxy', true);

  app.enableCors({
    origin: true,
    credentials: true,
  });


  // ----------------------------
  // Swagger
  // ----------------------------
  const config = new DocumentBuilder()
    .setTitle('PROJET VTC')
    .setDescription('API POUR LE PROJET VTC')
    .setVersion('1.0')
    .addTag('covoitivoire')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Entrez le token JWT',
        in: 'header',
      },
      'access-token',
    )
    .addServer('http://localhost:4000', 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger accessible sur /api
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Garde le token entre les refresh
    },
  });

  // Appliquer le filtre global
  app.useGlobalFilters(new AllExceptionsFilter());

  // ----------------------------
  // Lancer le serveur
  // ----------------------------
  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);

  console.log(`🚀 API running on port ${port}`);
}

bootstrap();
