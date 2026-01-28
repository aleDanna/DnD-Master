/**
 * OpenAI client configuration
 */

import OpenAI from 'openai';

// Validate environment variable
if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY not set. AI features will not work.');
}

/**
 * OpenAI client instance
 * Uses gpt-4 by default for complex DM reasoning
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Model configurations for different use cases
 */
export const ModelConfig = {
  // Primary model for narrative and complex decisions
  DM_NARRATIVE: 'gpt-4-turbo-preview',

  // Faster model for simple validations
  VALIDATION: 'gpt-3.5-turbo',

  // Model for combat calculations (accuracy matters)
  COMBAT: 'gpt-4-turbo-preview',

  // Maximum tokens for responses
  MAX_TOKENS: {
    NARRATIVE: 1000,
    VALIDATION: 200,
    COMBAT: 500,
  },

  // Temperature settings (0 = deterministic, 1 = creative)
  TEMPERATURE: {
    NARRATIVE: 0.8,
    VALIDATION: 0.1,
    COMBAT: 0.3,
  },
} as const;

/**
 * Rate limiting configuration
 */
export const RateLimits = {
  // Requests per minute per user
  REQUESTS_PER_MINUTE: 20,

  // Maximum concurrent requests
  MAX_CONCURRENT: 5,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

/**
 * Helper to create a chat completion with retry logic
 */
export async function createChatCompletion(
  messages: OpenAI.ChatCompletionMessageParam[],
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<OpenAI.ChatCompletion> {
  const {
    model = ModelConfig.DM_NARRATIVE,
    maxTokens = ModelConfig.MAX_TOKENS.NARRATIVE,
    temperature = ModelConfig.TEMPERATURE.NARRATIVE,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RateLimits.MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      });

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on authentication errors
      if (error instanceof OpenAI.AuthenticationError) {
        throw error;
      }

      // Rate limit handling
      if (error instanceof OpenAI.RateLimitError) {
        const delay = RateLimits.RETRY_DELAY_MS * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Retry on transient errors
      if (attempt < RateLimits.MAX_RETRIES - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, RateLimits.RETRY_DELAY_MS * (attempt + 1))
        );
      }
    }
  }

  throw lastError || new Error('Failed to complete chat request');
}

/**
 * Check if OpenAI is configured and working
 */
export async function checkOpenAIConnection(): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) {
    return false;
  }

  try {
    await openai.models.list();
    return true;
  } catch {
    return false;
  }
}
