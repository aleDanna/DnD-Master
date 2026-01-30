/**
 * Bootstrap entry point
 * Loads environment variables before importing any other modules
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env BEFORE any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Now dynamically import the main app
import('./index.js');
