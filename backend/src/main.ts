import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { env } from './lib/env';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get MongoDB connection and set up event listeners
  const connection = app.get<Connection>(getConnectionToken());

  connection.on('connected', () => {
    console.log('MongoDB connected successfully');
    console.log(`Database: ${connection.db?.databaseName || 'N/A'}`);
    console.log(`Host: ${connection.host || 'N/A'}`);
  });

  app.enableCors({
    origin: env.FRONTEND_URL,
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(env.PORT);
  console.log(`Application is running on: http://localhost:${env.PORT}`);
}
bootstrap();
