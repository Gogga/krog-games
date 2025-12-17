import jwt from 'jsonwebtoken';
import { dbOperations, User } from '../db';

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'krog-chess-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  username: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: Omit<User, 'password_hash'>;
  token?: string;
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Register a new user
export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResult> {
  // Validate input
  if (!username || username.length < 3 || username.length > 20) {
    return { success: false, message: 'Username must be 3-20 characters' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { success: false, message: 'Username can only contain letters, numbers, and underscores' };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Invalid email address' };
  }

  if (!password || password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters' };
  }

  // Check if username exists
  const existingUsername = dbOperations.getUserByUsername(username);
  if (existingUsername) {
    return { success: false, message: 'Username already taken' };
  }

  // Check if email exists
  const existingEmail = dbOperations.getUserByEmail(email);
  if (existingEmail) {
    return { success: false, message: 'Email already registered' };
  }

  // Create user
  const user = await dbOperations.createUser(username, email, password);
  if (!user) {
    return { success: false, message: 'Failed to create user' };
  }

  const token = generateToken(user);
  dbOperations.updateLastLogin(user.id);

  return {
    success: true,
    message: 'Registration successful',
    user,
    token
  };
}

// Login user
export async function login(
  usernameOrEmail: string,
  password: string
): Promise<AuthResult> {
  if (!usernameOrEmail || !password) {
    return { success: false, message: 'Username/email and password required' };
  }

  // Find user by username or email
  let userWithPassword = dbOperations.getUserByUsername(usernameOrEmail) as (User & { password_hash: string }) | null;
  if (!userWithPassword) {
    userWithPassword = dbOperations.getUserByEmail(usernameOrEmail) as (User & { password_hash: string }) | null;
  }

  if (!userWithPassword) {
    return { success: false, message: 'Invalid credentials' };
  }

  // Verify password
  const isValid = await dbOperations.verifyPassword(userWithPassword, password);
  if (!isValid) {
    return { success: false, message: 'Invalid credentials' };
  }

  // Get user without password hash
  const user = dbOperations.getUserById(userWithPassword.id);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  const token = generateToken(user);
  dbOperations.updateLastLogin(user.id);

  return {
    success: true,
    message: 'Login successful',
    user,
    token
  };
}

// Get user from token
export function getUserFromToken(token: string): User | null {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }
  return dbOperations.getUserById(payload.userId);
}

// Refresh token
export function refreshToken(oldToken: string): AuthResult {
  const payload = verifyToken(oldToken);
  if (!payload) {
    return { success: false, message: 'Invalid or expired token' };
  }

  const user = dbOperations.getUserById(payload.userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  const token = generateToken(user);
  return {
    success: true,
    message: 'Token refreshed',
    user,
    token
  };
}

// Get user profile with game history
export function getUserProfile(userId: string) {
  const user = dbOperations.getUserById(userId);
  if (!user) {
    return null;
  }

  const recentGames = dbOperations.getUserGames(userId, 10);
  const ratingHistory = dbOperations.getUserRatingHistory(userId, 20);

  return {
    user,
    recentGames,
    ratingHistory
  };
}

// Get leaderboard
export function getLeaderboard(limit: number = 100) {
  return dbOperations.getLeaderboard(limit);
}
