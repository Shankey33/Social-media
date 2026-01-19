/**
 * Environment variables configuration
 * All environment variables should be imported from this file
 */

export const env = {
  // Server Configuration
  PORT: parseInt(process.env.PORT || '3001', 10),
  
  // Database Configuration
  MONGODB_URL: process.env.MONGODB_URL || process.env.MONGO_DB_URL || 'mongodb://localhost:27017/social-media',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Redis Configuration
  REDIS_HOST: process.env.REDIS_HOST || 'redis-11607.crce217.ap-south-1-1.ec2.cloud.redislabs.com',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '11607', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD?.trim(),
  REDIS_USERNAME: process.env.REDIS_USERNAME?.trim(),
  
  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};
