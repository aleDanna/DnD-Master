/**
 * JWT Authentication Service
 * Handles token generation, validation, and user authentication
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './database.js';
import { getJwtSecret, getJwtExpiresIn } from './env.js';

/**
 * User interface matching the users table
 */
export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Auth response returned to clients
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresIn: string;
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for a user
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    displayName: user.display_name,
    isAdmin: user.is_admin,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await db.findOne<any>('users', { email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user in database
  const user = await db.insert<User>('users', {
    email,
    password_hash: passwordHash,
    display_name: displayName || email.split('@')[0],
    is_admin: false,
    created_at: new Date(),
    updated_at: new Date(),
  });

  if (!user) {
    throw new Error('Failed to create user');
  }

  // Generate token
  const accessToken = generateToken(user);

  return {
    user,
    accessToken,
    expiresIn: getJwtExpiresIn(),
  };
}

/**
 * Login a user with email and password
 */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  // Find user by email
  const userRow = await db.findOne<any>('users', { email });
  if (!userRow) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValid = await comparePassword(password, userRow.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Map to User type
  const user: User = {
    id: userRow.id,
    email: userRow.email,
    display_name: userRow.display_name,
    avatar_url: userRow.avatar_url,
    is_admin: userRow.is_admin,
    created_at: new Date(userRow.created_at),
    updated_at: new Date(userRow.updated_at),
  };

  // Generate token
  const accessToken = generateToken(user);

  return {
    user,
    accessToken,
    expiresIn: getJwtExpiresIn(),
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const row = await db.findOne<any>('users', { id: userId });
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    is_admin: row.is_admin,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

/**
 * Get user from token
 */
export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  return getUserById(payload.userId);
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  updates: Partial<Pick<User, 'display_name' | 'avatar_url'>>
): Promise<User | null> {
  const row = await db.update<any>(
    'users',
    {
      ...updates,
      updated_at: new Date(),
    },
    { id: userId }
  );

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    is_admin: row.is_admin,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  // Get current user
  const userRow = await db.findOne<any>('users', { id: userId });
  if (!userRow) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValid = await comparePassword(currentPassword, userRow.password_hash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await db.update(
    'users',
    { password_hash: newPasswordHash, updated_at: new Date() },
    { id: userId }
  );

  return true;
}

export const authService = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  getUserById,
  getUserFromToken,
  updateUser,
  changePassword,
};

export default authService;
