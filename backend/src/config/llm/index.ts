/**
 * LLM Configuration and Factory
 * Provides a configurable LLM provider based on environment settings
 */

import { OpenAIProvider } from './openai-provider.js';
import type {
  ILLMProvider,
  LLMProvider,
  LLMMessage,
  LLMRequestOptions,
  LLMResponse,
} from './types.js';

export * from './types.js';

/**
 * Create an LLM provider instance based on configuration
 */
export function createLLMProvider(provider?: LLMProvider): ILLMProvider {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY not set. AI features will not work.');
  }
  return new OpenAIProvider();
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
