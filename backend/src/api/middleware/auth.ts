import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../../config/database.js';
import { isMockMode } from '../../config/mockDatabase.js';
import type { ProfileRow } from '../../models/database.types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthenticatedUser {
  id: string;
  email: string;
  display_name?: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  display_name?: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      accessToken?: string;
    }
  }
}

/**
 * Parse mock token to extract user info
 * Mock tokens are in format: mock-jwt-{userId}
 */
function parseMockToken(token: string): AuthenticatedUser | null {
  // Check if it's a mock token format
  if (token.startsWith('mock-jwt-')) {
    const userId = token.substring(9); // Remove 'mock-jwt-' prefix
    return {
      id: userId,
      email: `user-${userId}@mock.local`,
      display_name: 'Mock User',
    };
  }

  return null;
}

/**
 * Verify JWT token and return payload
 */
function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware to validate JWT token and attach user to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    // In mock mode, accept any token and create a mock user
    if (isMockMode()) {
      const mockUser = parseMockToken(token);
      if (mockUser) {
        req.user = mockUser;
        req.accessToken = token;
        next();
        return;
      }
    }

    // Verify JWT token
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
      return;
    }

    // Attach user info to request
    req.user = {
      id: payload.sub,
      email: payload.email,
      display_name: payload.display_name,
    };
    req.accessToken = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    // In mock mode, accept any token
    if (isMockMode()) {
      const mockUser = parseMockToken(token);
      if (mockUser) {
        req.user = mockUser;
        req.accessToken = token;
      }
      next();
      return;
    }

    // Verify JWT token
    const payload = verifyToken(token);

    if (payload) {
      req.user = {
        id: payload.sub,
        email: payload.email,
        display_name: payload.display_name,
      };
      req.accessToken = token;
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthenticatedUser): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    display_name: user.display_name,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: AuthenticatedUser; token: string }> {
  // Check if user already exists
  const existingResult = await query<ProfileRow>(
    'SELECT * FROM profiles WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingResult.rowCount > 0) {
    throw new Error('User with this email already exists');
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);

  const result = await query<ProfileRow>(
    `INSERT INTO profiles (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email.toLowerCase(), passwordHash, displayName]
  );

  if (result.rowCount === 0) {
    throw new Error('Failed to create user');
  }

  const profile = result.rows[0];
  const user: AuthenticatedUser = {
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
  };

  const token = generateToken(user);

  return { user, token };
}

/**
 * Login a user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: AuthenticatedUser; token: string }> {
  // Find user by email
  const result = await query<ProfileRow>(
    'SELECT * FROM profiles WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rowCount === 0) {
    throw new Error('Invalid email or password');
  }

  const profile = result.rows[0];

  // Verify password
  const isValid = await verifyPassword(password, profile.password_hash);

  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const user: AuthenticatedUser = {
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
  };

  const token = generateToken(user);

  return { user, token };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  const result = await query<ProfileRow>(
    'SELECT * FROM profiles WHERE id = $1',
    [id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const profile = result.rows[0];
  return {
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
  };
}
