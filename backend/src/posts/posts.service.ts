import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async create(createPostDto: CreatePostDto & { author: string }): Promise<PostDocument> {
    const post = new this.postModel(createPostDto);
    const savedPost = await post.save();
    console.log(`💾 Post saved to MongoDB: ${savedPost._id} by user ${savedPost.author}`);
    return savedPost;
  }

  async findByAuthor(authorId: string): Promise<PostDocument[]> {
    return this.postModel.find({ author: authorId }).sort({ createdAt: -1 }).exec();
  }

  async findByAuthors(authorIds: string[]): Promise<PostDocument[]> {
    return this.postModel
      .find({ author: { $in: authorIds } })
      .populate('author', 'username email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(): Promise<PostDocument[]> {
    return this.postModel.find().populate('author', 'username email').sort({ createdAt: -1 }).exec();
  }
}
