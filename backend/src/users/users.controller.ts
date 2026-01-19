import { Controller, Get, Post, Delete, Param, Query, UseGuards, Request, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    console.log(`🔍 Found ${users.length} users in DB`);
    return users;
  }

  @Get('me')
  async getMe(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      return null;
    }
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      following: (user.following || []).map((id: any) => id.toString()),
      followers: (user.followers || []).map((id: any) => id.toString()),
      friends: (user.friends || []).map((id: any) => id.toString()),
      sentFriendRequests: (user.sentFriendRequests || []).map((id: any) => id.toString()),
      receivedFriendRequests: (user.receivedFriendRequests || []).map((id: any) => id.toString()),
    };
  }

  @Get('search')
  async searchUsers(@Request() req, @Query('q') query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.usersService.searchUsers(query.trim(), req.user.userId);
  }

  @Post('follow/:userId')
  async followUser(@Request() req, @Param('userId') targetUserId: string) {
    await this.usersService.followUser(req.user.userId, targetUserId);

    // Send WebSocket notification
    const follower = await this.usersService.findById(req.user.userId);
    if (follower) {
      await this.notificationsGateway.notifyUserFollowed(targetUserId, follower.username);
    }

    return { message: 'User followed successfully' };
  }

  @Delete('follow/:userId')
  async unfollowUser(@Request() req, @Param('userId') targetUserId: string) {
    await this.usersService.unfollowUser(req.user.userId, targetUserId);
    return { message: 'User unfollowed successfully' };
  }

  @Post('friend-request/:userId')
  async sendFriendRequest(@Request() req, @Param('userId') targetUserId: string) {
    await this.usersService.sendFriendRequest(req.user.userId, targetUserId);

    // Send WebSocket notification
    const requester = await this.usersService.findById(req.user.userId);
    if (requester) {
      await this.notificationsGateway.sendNotification(
        targetUserId,
        'friend-request',
        `${requester.username} sent you a friend request`
      );
    }

    return { message: 'Friend request sent successfully' };
  }

  @Post('friend-request/:userId/accept')
  async acceptFriendRequest(@Request() req, @Param('userId') senderUserId: string) {
    await this.usersService.acceptFriendRequest(req.user.userId, senderUserId);

    // Send WebSocket notification
    const accepter = await this.usersService.findById(req.user.userId);
    if (accepter) {
      await this.notificationsGateway.sendNotification(
        senderUserId,
        'friend-accept',
        `${accepter.username} accepted your friend request`
      );
    }

    return { message: 'Friend request accepted successfully' };
  }

  @Post('friend-request/:userId/reject')
  async rejectFriendRequest(@Request() req, @Param('userId') senderUserId: string) {
    await this.usersService.rejectFriendRequest(req.user.userId, senderUserId);
    return { message: 'Friend request rejected successfully' };
  }

  @Delete('friend-request/:userId')
  async cancelFriendRequest(@Request() req, @Param('userId') targetUserId: string) {
    await this.usersService.cancelFriendRequest(req.user.userId, targetUserId);
    return { message: 'Friend request cancelled successfully' };
  }

  @Get('friends')
  async getFriends(@Request() req) {
    const friendIds = await this.usersService.getFriends(req.user.userId);
    const friends = await Promise.all(
      friendIds.map(id => this.usersService.findById(id))
    );
    return friends
      .filter(user => user !== null)
      .map(user => ({
        _id: user!._id.toString(),
        username: user!.username,
        email: user!.email,
      }));
  }

  @Delete('friends/:userId')
  async removeFriend(@Request() req, @Param('userId') friendId: string) {
    await this.usersService.removeFriend(req.user.userId, friendId);
    return { message: 'Friend removed successfully' };
  }
}
