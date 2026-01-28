/**
 * Anthropic (Claude) client configuration
 */

import Anthropic from '@anthropic-ai/sdk';

// Validate environment variable
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY not set. AI features will not work.');
}

/**
 * Anthropic client instance
 * Uses Claude Sonnet by default for DM reasoning
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Model configurations for different use cases
 */
export const ModelConfig = {
  // Primary model for narrative and complex decisions
  DM_NARRATIVE: 'claude-sonnet-4-20250514',

  // Faster model for simple validations
  VALIDATION: 'claude-3-haiku-20240307',

  // Model for combat calculations (accuracy matters)
  COMBAT: 'claude-sonnet-4-20250514',

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
 * Message type for Anthropic API
 */
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Helper to create a message with retry logic
 */
export async function createMessage(
  systemPrompt: string,
  messages: AnthropicMessage[],
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<Anthropic.Message> {
  const {
    model = ModelConfig.DM_NARRATIVE,
    maxTokens = ModelConfig.MAX_TOKENS.NARRATIVE,
    temperature = ModelConfig.TEMPERATURE.NARRATIVE,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RateLimits.MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages,
      });

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on authentication errors
      if (error instanceof Anthropic.AuthenticationError) {
        throw error;
      }

      // Rate limit handling
      if (error instanceof Anthropic.RateLimitError) {
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

  throw lastError || new Error('Failed to complete message request');
}

/**
 * Check if Anthropic is configured and working
 */
export async function checkAnthropicConnection(): Promise<boolean> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return false;
  }

  try {
    // Make a minimal API call to verify connection
    await anthropic.messages.create({
      model: ModelConfig.VALIDATION,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    return true;
  } catch {
    return false;
  }
}
