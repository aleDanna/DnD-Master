/**
 * Claude LLM Provider
 * Implementation using Anthropic's Claude models
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ILLMProvider,
  LLMMessage,
  LLMRequestOptions,
  LLMResponse,
  LLMProviderConfig,
} from './types.js';

const DEFAULT_CONFIG: LLMProviderConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  defaultModel: 'claude-sonnet-4-20250514',
  models: {
    narrative: 'claude-sonnet-4-20250514',
    validation: 'claude-3-haiku-20240307',
    combat: 'claude-sonnet-4-20250514',
  },
  maxTokens: {
    narrative: 1000,
    validation: 200,
    combat: 500,
  },
  temperature: {
    narrative: 0.8,
    validation: 0.1,
    combat: 0.3,
  },
};

export class ClaudeProvider implements ILLMProvider {
  readonly name = 'claude' as const;
  private client: Anthropic;
  private config: LLMProviderConfig;

  constructor(apiKey?: string) {
    this.config = {
      ...DEFAULT_CONFIG,
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
    });
  }

  async createMessage(
    systemPrompt: string,
    messages: LLMMessage[],
    options: LLMRequestOptions = {}
  ): Promise<LLMResponse> {
    const {
      model = this.config.models.narrative,
      maxTokens = this.config.maxTokens.narrative,
      temperature = this.config.temperature.narrative,
    } = options;

    // Convert to Anthropic message format (exclude system messages)
    const anthropicMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    // Extract text content from response
    const textBlock = response.content.find(block => block.type === 'text');
    const content = textBlock && 'text' in textBlock ? textBlock.text : '';

    return {
      content,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async checkConnection(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      await this.client.messages.create({
        model: this.config.models.validation,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  getConfig(): LLMProviderConfig {
    return { ...this.config };
  }
}
