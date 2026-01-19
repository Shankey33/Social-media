import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PostsService } from './posts.service';

@Processor('post-queue')
@Injectable()
export class PostsProcessor extends WorkerHost {
  constructor(private postsService: PostsService) {
    super();
  }

  async process(job: Job<{ authorId: string; title: string; description: string }>) {
    const { authorId, title, description } = job.data;
    return await this.postsService.create({
      author: authorId,
      title,
      description,
    });
  }
}
