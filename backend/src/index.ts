import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

import { errorHandler } from './api/middleware/error-handler.js';
import authRouter from './api/routes/auth.js';
import healthRouter from './api/routes/health.js';
import campaignsRouter from './api/routes/campaigns.js';
import sessionsRouter from './api/routes/sessions.js';
import gameRouter from './api/routes/game.js';
import charactersRouter from './api/routes/characters.js';

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/game', gameRouter);
app.use('/api/characters', charactersRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`🎲 DnD-Master API running on port ${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
