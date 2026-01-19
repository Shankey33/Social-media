import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      $or: [{ email: userData.email }, { username: userData.username }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    const user = new this.userModel(userData);
    const savedUser = await user.save();
    console.log(` User saved to MongoDB: ${savedUser._id} (${savedUser.username})`);
    return savedUser;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  async followUser(userId: string, targetUserId: string): Promise<void> {
    if (userId === targetUserId) {
      throw new ConflictException('Cannot follow yourself');
    }

    const user = await this.userModel.findById(userId);
    const targetUser = await this.userModel.findById(targetUserId);

    if (!user || !targetUser) {
      throw new NotFoundException('User not found');
    }

    if (user.following.some(id => id.toString() === targetUserId)) {
      throw new ConflictException('Already following this user');
    }

    user.following.push(targetUserId);
    targetUser.followers.push(userId);

    await user.save();
    await targetUser.save();
  }

  async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    const targetUser = await this.userModel.findById(targetUserId);

    if (!user || !targetUser) {
      throw new NotFoundException('User not found');
    }

    user.following = user.following.filter(id => id.toString() !== targetUserId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);

    await user.save();
    await targetUser.save();
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.following.map(id => id.toString());
  }

  async searchUsers(query: string, excludeUserId: string): Promise<UserDocument[]> {
    const searchRegex = new RegExp(query, 'i');
    return this.userModel
      .find({
        _id: { $ne: excludeUserId },
        $or: [
          { username: searchRegex },
          { email: searchRegex },
        ],
      })
      .select('-password')
      .limit(20)
      .exec();
  }

  async sendFriendRequest(userId: string, targetUserId: string): Promise<void> {
    if (userId === targetUserId) {
      throw new ConflictException('Cannot send friend request to yourself');
    }

    const user = await this.userModel.findById(userId);
    const targetUser = await this.userModel.findById(targetUserId);

    if (!user || !targetUser) {
      throw new NotFoundException('User not found');
    }

    // Initialize arrays if they don't exist (for backward compatibility)
    if (!user.friends) user.friends = [];
    if (!user.sentFriendRequests) user.sentFriendRequests = [];
    if (!user.receivedFriendRequests) user.receivedFriendRequests = [];
    if (!targetUser.friends) targetUser.friends = [];
    if (!targetUser.sentFriendRequests) targetUser.sentFriendRequests = [];
    if (!targetUser.receivedFriendRequests) targetUser.receivedFriendRequests = [];

    // Check if already friends
    if (user.friends.some(id => id.toString() === targetUserId)) {
      throw new ConflictException('Already friends with this user');
    }

    // Check if request already sent
    if (user.sentFriendRequests.some(id => id.toString() === targetUserId)) {
      throw new ConflictException('Friend request already sent');
    }

    // Check if request already received (auto-accept if both sent)
    if (user.receivedFriendRequests.some(id => id.toString() === targetUserId)) {
      // Both users sent requests, auto-accept
      await this.acceptFriendRequest(targetUserId, userId);
      return;
    }

    user.sentFriendRequests.push(targetUserId);
    targetUser.receivedFriendRequests.push(userId);

    await user.save();
    await targetUser.save();
    console.log(`💾 Friend request saved to MongoDB: ${userId} -> ${targetUserId}`);
  }

  async acceptFriendRequest(userId: string, senderUserId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    const sender = await this.userModel.findById(senderUserId);

    if (!user || !sender) {
      throw new NotFoundException('User not found');
    }

    // Initialize arrays if they don't exist
    if (!user.friends) user.friends = [];
    if (!user.receivedFriendRequests) user.receivedFriendRequests = [];
    if (!sender.friends) sender.friends = [];
    if (!sender.sentFriendRequests) sender.sentFriendRequests = [];

    // Check if request exists
    if (!user.receivedFriendRequests.some(id => id.toString() === senderUserId)) {
      throw new ConflictException('Friend request not found');
    }

    // Remove from requests
    user.receivedFriendRequests = user.receivedFriendRequests.filter(
      id => id.toString() !== senderUserId
    );
    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      id => id.toString() !== userId
    );

    // Add to friends
    if (!user.friends.some(id => id.toString() === senderUserId)) {
      user.friends.push(senderUserId);
    }
    if (!sender.friends.some(id => id.toString() === userId)) {
      sender.friends.push(userId);
    }

    await user.save();
    await sender.save();
    console.log(`💾 Friendship saved to MongoDB: ${userId} <-> ${senderUserId}`);
  }

  async rejectFriendRequest(userId: string, senderUserId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    const sender = await this.userModel.findById(senderUserId);

    if (!user || !sender) {
      throw new NotFoundException('User not found');
    }

    // Initialize arrays if they don't exist
    if (!user.receivedFriendRequests) user.receivedFriendRequests = [];
    if (!sender.sentFriendRequests) sender.sentFriendRequests = [];

    // Remove from requests
    user.receivedFriendRequests = user.receivedFriendRequests.filter(
      id => id.toString() !== senderUserId
    );
    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      id => id.toString() !== userId
    );

    await user.save();
    await sender.save();
  }

  async cancelFriendRequest(userId: string, targetUserId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    const targetUser = await this.userModel.findById(targetUserId);

    if (!user || !targetUser) {
      throw new NotFoundException('User not found');
    }

    // Initialize arrays if they don't exist
    if (!user.sentFriendRequests) user.sentFriendRequests = [];
    if (!targetUser.receivedFriendRequests) targetUser.receivedFriendRequests = [];

    // Remove from requests
    user.sentFriendRequests = user.sentFriendRequests.filter(
      id => id.toString() !== targetUserId
    );
    targetUser.receivedFriendRequests = targetUser.receivedFriendRequests.filter(
      id => id.toString() !== userId
    );

    await user.save();
    await targetUser.save();
  }

  async getFriends(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return (user.friends || []).map(id => id.toString());
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    const friend = await this.userModel.findById(friendId);

    if (!user || !friend) {
      throw new NotFoundException('User not found');
    }

    // Initialize arrays if they don't exist
    if (!user.friends) user.friends = [];
    if (!friend.friends) friend.friends = [];

    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId);

    await user.save();
    await friend.save();
  }
}
