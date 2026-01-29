/**
 * LLM Configuration and Factory
 * Provides a configurable LLM provider based on environment settings
 * Supports: OpenAI, Gemini, Claude
 */

import { OpenAIProvider } from './openai-provider.js';
import { GeminiProvider } from './gemini-provider.js';
import { ClaudeProvider } from './claude-provider.js';
import type {
  ILLMProvider,
  LLMProvider,
  LLMMessage,
  LLMRequestOptions,
  LLMResponse,
} from './types.js';

export * from './types.js';

/**
 * Get the configured LLM provider from environment
 */
function getProviderFromEnv(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();

  if (provider === 'gemini' || provider === 'google') {
    return 'gemini';
  }
  if (provider === 'claude' || provider === 'anthropic') {
    return 'claude';
  }
  return 'openai';
}

/**
 * Create an LLM provider instance based on configuration
 */
export function createLLMProvider(provider?: LLMProvider): ILLMProvider {
  const selectedProvider = provider || getProviderFromEnv();

  switch (selectedProvider) {
    case 'gemini':
      if (!process.env.GEMINI_API_KEY) {
        console.warn('Warning: GEMINI_API_KEY not set. AI features will not work.');
      }
      return new GeminiProvider();

    case 'claude':
      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('Warning: ANTHROPIC_API_KEY not set. AI features will not work.');
      }
      return new ClaudeProvider();

    case 'openai':
    default:
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Warning: OPENAI_API_KEY not set. AI features will not work.');
      }
      return new OpenAIProvider();
  }
}

// Default singleton instance
let defaultProvider: ILLMProvider | null = null;

/**
 * Get the default LLM provider instance (singleton)
 */
export function getLLMProvider(): ILLMProvider {
  if (!defaultProvider) {
    defaultProvider = createLLMProvider();
  }
  return defaultProvider;
}

/**
 * Reset the default provider (useful for testing or reconfiguration)
 */
export function resetLLMProvider(): void {
  defaultProvider = null;
}

/**
 * Convenience function to create a message using the default provider
 */
export async function createMessage(
  systemPrompt: string,
  messages: LLMMessage[],
  options?: LLMRequestOptions
): Promise<LLMResponse> {
  const provider = getLLMProvider();
  return provider.createMessage(systemPrompt, messages, options);
}

/**
 * Get model configuration for the current provider
 */
export function getModelConfig() {
  const provider = getLLMProvider();
  const config = provider.getConfig();

  return {
    DM_NARRATIVE: config.models.narrative,
    VALIDATION: config.models.validation,
    COMBAT: config.models.combat,
    MAX_TOKENS: config.maxTokens,
    TEMPERATURE: config.temperature,
  };
}

/**
 * Check if the LLM provider is properly configured
 */
export async function checkLLMConnection(): Promise<boolean> {
  const provider = getLLMProvider();
  return provider.checkConnection();
}

/**
 * Get the name of the current LLM provider
 */
export function getCurrentProviderName(): LLMProvider {
  const provider = getLLMProvider();
  return provider.name;
}
