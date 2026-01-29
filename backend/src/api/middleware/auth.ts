import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById, JwtPayload } from '../../config/auth.js';
import { isMockMode } from '../../config/mockSupabase.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  display_name?: string;
  is_admin?: boolean;
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

  // Try to decode as a simple base64 JSON (for localStorage mock sessions)
  try {
    // The mock session from frontend may have user data
    return {
      id: 'mock-user-' + Date.now(),
      email: 'test@mock.local',
      display_name: 'Test User',
    };
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

    // Attach user info from JWT payload to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      display_name: payload.displayName || undefined,
      is_admin: payload.isAdmin,
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
        id: payload.userId,
        email: payload.email,
        display_name: payload.displayName || undefined,
        is_admin: payload.isAdmin,
      };
      req.accessToken = token;
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
}
