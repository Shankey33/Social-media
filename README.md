# Social Media App

A minimal social media application built with NestJS and Next.js, demonstrating JWT authentication, Redis queues, WebSocket notifications, and rate limiting.

## Features

- **Authentication**: JWT-based signup and login
- **Rate Limiting**: 
  - Signup: 5 requests per minute
  - Login: 5 requests per minute
  - Post creation: 3 requests per minute
- **Post Creation**: Handled via BullMQ queue with Redis
- **Follow/Unfollow**: Real-time WebSocket notifications when users are followed
- **Timeline**: Displays posts from followed users, sorted by newest first

## Tech Stack

### Backend
- NestJS
- MongoDB (Mongoose)
- Redis + BullMQ
- WebSocket (Socket.IO)
- JWT Authentication
- Rate Limiting (Throttler)

### Frontend
- Next.js 14 (App Router)
- TypeScript
- shadcn/ui components
- Socket.IO Client
- Tailwind CSS

## Prerequisites

- Node.js 18+
- MongoDB
- Redis

## Setup

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```env
MONGODB_URL=mongodb://localhost:27017/social-media
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
```

4. Start MongoDB and Redis:
```bash
# MongoDB (if not running as a service)
mongod

# Redis (if not running as a service)
redis-server
```

5. Run the backend:
```bash
npm run start:dev
```

The backend will be available at `http://localhost:3001`

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

4. Run the frontend:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/signup` - Sign up (Rate limited: 5/min)
- `POST /auth/login` - Login (Rate limited: 5/min)

### Users
- `GET /users` - Get all users (Protected)
- `GET /users/me` - Get current user (Protected)
- `POST /users/follow/:userId` - Follow a user (Protected)
- `DELETE /users/follow/:userId` - Unfollow a user (Protected)

### Posts
- `POST /posts` - Create a post (Protected, Rate limited: 3/min, Queued)
- `GET /posts/timeline` - Get timeline (Protected)
- `GET /posts` - Get all posts (Protected)

## WebSocket Events

- `notification` - Real-time notification when a user is followed
  - Payload: `{ type: 'follow', message: 'User X followed you' }`

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # Users module
│   │   ├── posts/         # Posts module with BullMQ
│   │   ├── notifications/ # WebSocket gateway
│   │   └── app.module.ts
│   └── package.json
├── frontend/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities and contexts
│   └── package.json
└── README.md
```

## Notes

- This is a minimal implementation for assessment purposes
- JWT tokens are stored in localStorage (not recommended for production)
- Rate limiting is implemented using NestJS Throttler
- Post creation is queued using BullMQ and processed asynchronously
- WebSocket notifications are sent in real-time when users follow each other
