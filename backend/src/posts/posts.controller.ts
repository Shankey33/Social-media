import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PostsService } from './posts.service';
import { UsersService } from '../users/users.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    @InjectQueue('post-queue') private postQueue: Queue,
  ) {}

  @Post()
  @Throttle({ post: { limit: 3, ttl: 60000 } })
  async createPost(@Request() req, @Body() createPostDto: CreatePostDto) {
    await this.postQueue.add('create-post', {
      authorId: req.user.userId,
      title: createPostDto.title,
      description: createPostDto.description,
    });
    return { message: 'Post creation queued successfully' };
  }

  @Get('timeline')
  async getTimeline(@Request() req) {
    // Get friends list instead of following
    const friendIds = await this.usersService.getFriends(req.user.userId);
    // Include current user's own posts in timeline
    const authorIds = [...friendIds, req.user.userId];
    return this.postsService.findByAuthors(authorIds);
  }

  @Get()
  async findAll() {
    return this.postsService.findAll();
  }
}
