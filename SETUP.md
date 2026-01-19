# Setup Guide

## Quick Start

### 1. Prerequisites

Make sure you have the following installed:
- Node.js 18+ 
- MongoDB (running on default port 27017)
- Redis (running on default port 6379)

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
MONGODB_URL=mongodb://localhost:27017/social-media
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
```

Start the backend:
```bash
npm run start:dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

Start the frontend:
```bash
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Testing the Features

1. **Signup/Login**: Create an account and login (rate limited to 5 requests/minute)
2. **Create Post**: Create posts (rate limited to 3 posts/minute, processed via queue)
3. **Follow Users**: Follow other users to see real-time WebSocket notifications
4. **Timeline**: View posts from users you follow, sorted by newest first

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check your MongoDB service
- Verify the connection string in `.env`

### Redis Connection Issues
- Ensure Redis is running: `redis-server` or check your Redis service
- Verify Redis host and port in `.env`

### WebSocket Connection Issues
- Check that the frontend WebSocket URL matches the backend URL
- Verify JWT token is being sent correctly in the socket connection
- Check browser console for connection errors

### Rate Limiting
- If you hit rate limits, wait 1 minute before trying again
- Signup/Login: 5 requests per minute
- Post creation: 3 requests per minute
