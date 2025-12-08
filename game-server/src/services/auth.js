import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || 'changethis';
const ALGORITHM = 'HS256';

/**
 * Verify JWT token from FastAPI
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Extract user ID from token
 * @param {string} token - JWT token
 * @returns {string|null} - User ID or null if invalid
 */
export function getUserIdFromToken(token) {
  const decoded = verifyToken(token);
  return decoded ? decoded.sub : null;
}

/**
 * Socket.io authentication middleware
 * Validates JWT token and attaches userId to socket
 */
export function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    console.log('No token provided for socket connection');
    return next(new Error('Authentication required'));
  }

  const userId = getUserIdFromToken(token);

  if (!userId) {
    console.log('Invalid token for socket connection');
    return next(new Error('Invalid authentication token'));
  }

  // Attach userId to socket for use in event handlers
  socket.userId = userId;
  socket.token = token;

  console.log(`Socket authenticated for user: ${userId}`);
  next();
}
