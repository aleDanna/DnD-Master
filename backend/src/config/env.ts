/**
 * Environment validation
 * Validates required environment variables on startup
 */

interface EnvConfig {
  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  FRONTEND_URL: string;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY?: string;

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

  // Supabase (required)
  if (!process.env.SUPABASE_URL) {
    errors.push('SUPABASE_URL is required');
  } else {
    config.SUPABASE_URL = process.env.SUPABASE_URL;
  }

  if (!process.env.SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY is required');
  } else {
    config.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  }

  if (process.env.SUPABASE_SERVICE_KEY) {
    config.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  } else {
    warnings.push('SUPABASE_SERVICE_KEY not set - some admin features may be limited');
  }

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

export type { EnvConfig };
