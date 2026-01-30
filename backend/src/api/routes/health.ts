import { Router, Request, Response } from 'express';
import { healthCheck } from '../../config/database.js';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    api: 'up' | 'down';
    database: 'up' | 'down' | 'unknown';
  };
  uptime: number;
}

const startTime = Date.now();

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
router.get('/', async (_req: Request, res: Response) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    services: {
      api: 'up',
      database: 'unknown',
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  // Check database connection
  try {
    const isHealthy = await healthCheck();
    health.services.database = isHealthy ? 'up' : 'down';
  } catch {
    health.services.database = 'down';
  }

  // Determine overall status
  if (health.services.database === 'down') {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /api/health/ready
 * Readiness check - returns 200 only if all services are ready
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check database
    const isHealthy = await healthCheck();

    if (!isHealthy) {
      res.status(503).json({
        ready: false,
        reason: 'Database not ready',
      });
      return;
    }

    res.status(200).json({ ready: true });
  } catch {
    res.status(503).json({
      ready: false,
      reason: 'Service initialization failed',
    });
  }
});

/**
 * GET /api/health/live
 * Liveness check - returns 200 if the API process is running
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

export default router;
