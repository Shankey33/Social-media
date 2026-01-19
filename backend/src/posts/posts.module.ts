import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostsProcessor } from './posts.processor';
import { Post, PostSchema } from './schemas/post.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    BullModule.registerQueue({
      name: 'post-queue',
    }),
    UsersModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsProcessor],
  exports: [PostsService],
})
export class PostsModule {}
