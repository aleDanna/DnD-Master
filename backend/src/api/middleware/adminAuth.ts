/**
 * Admin Authorization Middleware
 * Checks if the authenticated user has admin privileges
 *
 * Task: T034
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Check if running in development/test mode
 */
function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}

/**
 * Extend Express Request to include admin status
 */
declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
    }
  }
}

/**
 * Middleware to check if the user is an admin
 * Must be used after authMiddleware
 */
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // In mock mode, treat all users as admins for testing
    if (isDevMode()) {
      req.isAdmin = true;
      next();
      return;
    }

    // Check admin status from JWT payload (set by auth middleware)
    if (!req.user.is_admin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
      return;
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify admin status',
      },
    });
  }
}

/**
 * Check if user is admin (without failing the request)
 * Useful for conditional admin features
 */
export async function checkAdminStatus(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    req.isAdmin = false;

    if (!req.user) {
      next();
      return;
    }

    // In mock mode, treat all users as admins
    if (isDevMode()) {
      req.isAdmin = true;
      next();
      return;
    }

    // Check admin status from JWT payload
    req.isAdmin = req.user.is_admin || false;
    next();
  } catch {
    req.isAdmin = false;
    next();
  }
}

export default adminMiddleware;
