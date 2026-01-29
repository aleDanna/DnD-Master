/**
 * Authentication API Routes
 * Handles user registration, login, and token management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  registerUser,
  loginUser,
  getUserById,
  verifyToken,
  generateToken,
} from '../../config/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().min(1, 'Display name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.errors[0].message,
        },
      });
      return;
    }

    const { email, password, display_name } = validation.data;

    const result = await registerUser(email, password, display_name);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          display_name: result.user.display_name,
        },
        access_token: result.token,
        token_type: 'Bearer',
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);

    const message = error instanceof Error ? error.message : 'Failed to register user';

    if (message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'A user with this email already exists',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to register user',
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.errors[0].message,
        },
      });
      return;
    }

    const { email, password } = validation.data;

    const result = await loginUser(email, password);

    if (!result) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          display_name: result.user.display_name,
        },
        access_token: result.token,
        token_type: 'Bearer',
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to login',
      },
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.user!.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        is_admin: user.is_admin,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user profile',
      },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Generate a new token with the current user info
    const newToken = generateToken({
      userId: req.user!.id,
      email: req.user!.email,
      displayName: req.user!.display_name,
      isAdmin: req.user!.is_admin || false,
    });

    res.json({
      success: true,
      data: {
        access_token: newToken,
        token_type: 'Bearer',
      },
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh token',
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (_req: Request, res: Response) => {
  // JWT tokens are stateless, so logout is handled client-side
  // This endpoint exists for API consistency
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
});

export default router;
