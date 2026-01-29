/**
 * Environment validation
 * Validates required environment variables on startup
 */

interface EnvConfig {
  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  FRONTEND_URL: string;

  // Database (PostgreSQL)
  DATABASE_URL?: string;
  DB_HOST?: string;
  DB_PORT?: number;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;

  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;

  // LLM Providers (at least one required)
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;

  // Optional
  LLM_PROVIDER?: 'openai' | 'gemini' | 'claude' | 'mock';
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<EnvConfig>;
}

/**
 * Validate environment variables on startup
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Partial<EnvConfig> = {};

  // Server configuration
  config.PORT = parseInt(process.env.PORT || '3001', 10);
  config.NODE_ENV = (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development';
  config.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Database configuration (PostgreSQL)
  if (process.env.DATABASE_URL) {
    config.DATABASE_URL = process.env.DATABASE_URL;
  } else if (process.env.DB_HOST) {
    config.DB_HOST = process.env.DB_HOST;
    config.DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
    config.DB_NAME = process.env.DB_NAME || 'dnd_master';
    config.DB_USER = process.env.DB_USER || 'postgres';
    config.DB_PASSWORD = process.env.DB_PASSWORD;
  } else {
    // Default to local PostgreSQL for development
    warnings.push(
      'No DATABASE_URL or DB_HOST set. Using default local PostgreSQL connection. ' +
      'Set DATABASE_URL for production.'
    );
  }

  // JWT Authentication
  if (!process.env.JWT_SECRET) {
    if (config.NODE_ENV === 'production') {
      errors.push('JWT_SECRET is required in production');
    } else {
      warnings.push('JWT_SECRET not set. Using default development secret.');
      config.JWT_SECRET = 'dev-secret-change-in-production';
    }
  } else {
    config.JWT_SECRET = process.env.JWT_SECRET;
  }
  config.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  // LLM Provider configuration
  const llmProvider = process.env.LLM_PROVIDER as EnvConfig['LLM_PROVIDER'];
  config.LLM_PROVIDER = llmProvider || 'mock';

  // Rules Explorer: Check for OpenAI API key (required for embeddings)
  if (process.env.OPENAI_API_KEY) {
    config.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  } else {
    warnings.push(
      'OPENAI_API_KEY not set - Rules Explorer semantic search and ingestion will be disabled. ' +
      'Only full-text search will be available.'
    );
  }

  // Validate LLM API keys based on provider
  if (llmProvider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
    } else {
      config.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    }
  } else if (llmProvider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      errors.push('GEMINI_API_KEY is required when LLM_PROVIDER=gemini');
    } else {
      config.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    }
  } else if (llmProvider === 'claude') {
    if (!process.env.ANTHROPIC_API_KEY) {
      errors.push('ANTHROPIC_API_KEY is required when LLM_PROVIDER=claude');
    } else {
      config.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    }
  } else if (llmProvider === 'mock') {
    warnings.push('Using mock LLM provider - AI responses will be simulated');
  } else if (llmProvider) {
    errors.push(`Invalid LLM_PROVIDER: ${llmProvider}. Valid values: openai, gemini, claude, mock`);
  }

  // Check if at least one LLM key is present (except for mock mode)
  if (llmProvider !== 'mock' && !llmProvider) {
    const hasAnyKey =
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.ANTHROPIC_API_KEY;

    if (!hasAnyKey) {
      warnings.push(
        'No LLM API keys configured. Set LLM_PROVIDER=mock for development without AI, ' +
        'or provide OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY'
      );
    }
  }

  // Logging
  config.LOG_LEVEL = (process.env.LOG_LEVEL as EnvConfig['LOG_LEVEL']) || 'info';

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config,
  };
}

/**
 * Run validation and handle results
 */
export function initializeEnv(): EnvConfig {
  const result = validateEnv();

  // Log warnings
  for (const warning of result.warnings) {
    console.warn(`⚠️  ${warning}`);
  }

  // Log errors and exit if invalid
  if (!result.valid) {
    console.error('❌ Environment validation failed:');
    for (const error of result.errors) {
      console.error(`   - ${error}`);
    }
    console.error('');
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  console.log('✅ Environment validated successfully');

  return result.config as EnvConfig;
}

/**
 * Get JWT secret for token operations
 */
export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-secret-change-in-production';
}

/**
 * Get JWT expiration time
 */
export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}

export type { EnvConfig };
