/**
 * Environment variables configuration
 * All environment variables should be imported from this file
 */

export const env = {
  // API Configuration
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  // WebSocket Configuration
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
};
