// Handbook API Routes - T009
// Route registration for all handbook endpoints

import { Router } from 'express';
import rulesRouter from './rules.js';
import spellsRouter from './spells.js';
import bestiaryRouter from './bestiary.js';
import equipmentRouter from './equipment.js';
import charactersRouter from './characters.js';
import searchRouter from './search.js';

const router = Router();

// Mount sub-routers
router.use('/rules', rulesRouter);
router.use('/spells', spellsRouter);
router.use('/monsters', bestiaryRouter);
router.use('/items', equipmentRouter);
router.use('/classes', charactersRouter);
router.use('/races', charactersRouter);
router.use('/backgrounds', charactersRouter);
router.use('/feats', charactersRouter);
router.use('/search', searchRouter);
router.use('/context', searchRouter);

// Reference endpoints (conditions, skills, abilities)
// These are lightweight and can be in the main router
import { query } from '../../config/database.js';
import { rowsToCamelCase } from '../../services/handbook/contentService.js';

router.get('/conditions', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM conditions ORDER BY name');
    res.json(rowsToCamelCase(result.rows));
  } catch (error) {
    next(error);
  }
});

router.get('/conditions/:slug', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM conditions WHERE slug = $1', [req.params.slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Condition not found' });
    }
    res.json(rowsToCamelCase(result.rows)[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/skills', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT s.*, a.name as ability_name
      FROM skills s
      LEFT JOIN abilities a ON s.ability_id = a.id
      ORDER BY s.name
    `);
    res.json(rowsToCamelCase(result.rows));
  } catch (error) {
    next(error);
  }
});

router.get('/abilities', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM abilities ORDER BY name');
    res.json(rowsToCamelCase(result.rows));
  } catch (error) {
    next(error);
  }
});

export default router;
