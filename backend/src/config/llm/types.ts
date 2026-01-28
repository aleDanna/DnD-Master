/**
 * LLM Provider Types
 * Defines the common interface for all LLM providers
 */

export type LLMProvider = 'openai' | 'gemini' | 'claude';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProviderConfig {
  apiKey: string;
  defaultModel: string;
  models: {
    narrative: string;
    validation: string;
    combat: string;
  };
  maxTokens: {
    narrative: number;
    validation: number;
    combat: number;
  };
  temperature: {
    narrative: number;
    validation: number;
    combat: number;
  };
}

/**
 * Abstract LLM Provider interface
 * All providers must implement this interface
 */
export interface ILLMProvider {
  readonly name: LLMProvider;

  /**
   * Send a message and get a response
   */
  createMessage(
    systemPrompt: string,
    messages: LLMMessage[],
    options?: LLMRequestOptions
  ): Promise<LLMResponse>;

  /**
   * Check if the provider is properly configured
   */
  checkConnection(): Promise<boolean>;

  /**
   * Get the provider's model configuration
   */
  getConfig(): LLMProviderConfig;
}
