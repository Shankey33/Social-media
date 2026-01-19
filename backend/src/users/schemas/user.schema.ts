import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Post } from '../../posts/schemas/post.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  following: string[];

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  followers: string[];

  @Prop({ type: [{ type: String, ref: 'Post' }], default: [] })
  posts: string[];

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  friends: string[];

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  sentFriendRequests: string[];

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  receivedFriendRequests: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
