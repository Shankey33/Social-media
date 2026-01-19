import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { env } from './lib/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const mongoUrl = configService.get<string>('MONGODB_URL') || env.MONGODB_URL;
        console.log(`Database URI: ${mongoUrl.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
        
        return {
          uri: mongoUrl,
          retryWrites: true,
          w: 'majority',
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 5, // 5 requests per minute for signup/login
      },
      {
        name: 'post',
        ttl: 60000, // 1 minute
        limit: 3, // 3 requests per minute for posts
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST') || env.REDIS_HOST;
        const port = parseInt(configService.get<string>('REDIS_PORT') || String(env.REDIS_PORT), 10);
        const password = configService.get<string>('REDIS_PASSWORD')?.trim() || env.REDIS_PASSWORD;
        const username = configService.get<string>('REDIS_USERNAME')?.trim() || env.REDIS_USERNAME;
        
        // Build connection object
        const connection: any = {
          host,
          port,
        };
        
        // Add password (required for Redis Cloud)
        if (password) {
          connection.password = password;
        }
        
        // Redis Cloud with ACL requires username even for default user
        // Include username if provided
        const cleanUsername = username?.trim();
        if (cleanUsername) {
          connection.username = cleanUsername;
        }
        
        // Redis Cloud typically requires TLS
        // Uncomment if your Redis Cloud instance requires TLS
        // connection.tls = {};
        
        return { connection };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    PostsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
