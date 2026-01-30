/**
 * Content Routes Index
 * T055: Register all content routes in main router
 * T131: Add request caching headers for content endpoints
 *
 * This file registers all content-related routes for the Rules Explorer feature.
 */

import { Router } from 'express';
import { longCache } from '../../middleware/cache-headers.js';

// Import route modules
import rulesRouter from './rules.js';
import classesRouter from './classes.js';
import racesRouter from './races.js';
import spellsRouter from './spells.js';
import bestiaryRouter from './bestiary.js';
import itemsRouter from './items.js';
import backgroundsRouter from './backgrounds.js';
import featsRouter from './feats.js';
import conditionsRouter from './conditions.js';
import skillsRouter from './skills.js';
import navigationRouter from './navigation.js';
// import searchRouter from './search.js'; // Phase 4

const contentRouter = Router();

// Apply caching to all content routes (static D&D reference content)
contentRouter.use(longCache);

// Register routes
contentRouter.use('/rules', rulesRouter);
contentRouter.use('/classes', classesRouter);
contentRouter.use('/races', racesRouter);
contentRouter.use('/spells', spellsRouter);
contentRouter.use('/bestiary', bestiaryRouter);
contentRouter.use('/items', itemsRouter);
contentRouter.use('/backgrounds', backgroundsRouter);
contentRouter.use('/feats', featsRouter);
contentRouter.use('/conditions', conditionsRouter);
contentRouter.use('/skills', skillsRouter);
contentRouter.use('/navigation', navigationRouter);
// contentRouter.use('/search', searchRouter); // Phase 4

// API info route
contentRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Rules Explorer Content API',
    version: '1.0.0',
    endpoints: [
      '/rules',
      '/classes',
      '/races',
      '/spells',
      '/bestiary',
      '/items',
      '/backgrounds',
      '/feats',
      '/conditions',
      '/skills',
      '/navigation/tree',
    ],
  });
});

export default contentRouter;
