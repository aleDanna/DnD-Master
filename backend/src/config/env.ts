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
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_NAME: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_URL?: string;
  DATABASE_POOL_SIZE: number;

  // JWT Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

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

  // Database configuration
  // Check for DATABASE_URL first (common in production environments)
  if (process.env.DATABASE_URL) {
    config.DATABASE_URL = process.env.DATABASE_URL;
  } else {
    // Check individual database environment variables
    if (!process.env.DATABASE_HOST) {
      warnings.push('DATABASE_HOST not set - using mock database mode');
    } else {
      config.DATABASE_HOST = process.env.DATABASE_HOST;
    }

    if (!process.env.DATABASE_NAME) {
      warnings.push('DATABASE_NAME not set - using mock database mode');
    } else {
      config.DATABASE_NAME = process.env.DATABASE_NAME;
    }

    if (!process.env.DATABASE_USER) {
      warnings.push('DATABASE_USER not set - using mock database mode');
    } else {
      config.DATABASE_USER = process.env.DATABASE_USER;
    }

    if (!process.env.DATABASE_PASSWORD) {
      warnings.push('DATABASE_PASSWORD not set - using mock database mode');
    } else {
      config.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
    }
  }

  config.DATABASE_PORT = parseInt(process.env.DATABASE_PORT || '5432', 10);
  config.DATABASE_POOL_SIZE = parseInt(process.env.DATABASE_POOL_SIZE || '10', 10);

  // JWT configuration
  if (!process.env.JWT_SECRET) {
    if (config.NODE_ENV === 'production') {
      errors.push('JWT_SECRET is required in production');
    } else {
      warnings.push('JWT_SECRET not set - using default development secret');
      config.JWT_SECRET = 'dev-secret-change-in-production';
    }
  } else {
    config.JWT_SECRET = process.env.JWT_SECRET;
  }

  config.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  // LLM Provider configuration
  const llmProvider = process.env.LLM_PROVIDER as EnvConfig['LLM_PROVIDER'];
  config.LLM_PROVIDER = llmProvider || 'mock';

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

export type { EnvConfig };
