import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { env } from '../lib/env';

@WebSocketGateway({
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      console.log(`🔌 New connection attempt: ${client.id}`);
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        console.warn(`⚠️ No token provided for client ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.userSockets.set(userId, client.id);
      console.log(`✅ User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      console.error(`❌ WebSocket authentication failed for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        console.log(`🔌 User ${userId} disconnected (${client.id})`);
        break;
      }
    }
  }

  async sendNotification(userId: string, type: string, message: string) {
    const socketId = this.userSockets.get(userId);
    console.log(`Sending notification to user ${userId} (socket: ${socketId || 'offline'}): [${type}] ${message}`);

    if (socketId) {
      this.server.to(socketId).emit('notification', {
        type,
        message,
      });
    }
  }

  async notifyUserFollowed(followedUserId: string, followerUsername: string) {
    await this.sendNotification(
      followedUserId,
      'follow',
      `User ${followerUsername} followed you`
    );
  }
}
