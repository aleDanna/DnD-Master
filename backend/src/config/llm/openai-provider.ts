/**
 * OpenAI LLM Provider
 * Implementation using OpenAI's GPT models
 */

import OpenAI from 'openai';
import type {
  ILLMProvider,
  LLMMessage,
  LLMRequestOptions,
  LLMResponse,
  LLMProviderConfig,
} from './types.js';

const DEFAULT_CONFIG: LLMProviderConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  defaultModel: 'gpt-4-turbo-preview',
  models: {
    narrative: 'gpt-4-turbo-preview',
    validation: 'gpt-3.5-turbo',
    combat: 'gpt-4-turbo-preview',
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

export class OpenAIProvider implements ILLMProvider {
  readonly name = 'openai' as const;
  private client: OpenAI;
  private config: LLMProviderConfig;

  constructor(apiKey?: string) {
    this.config = {
      ...DEFAULT_CONFIG,
      apiKey: apiKey || process.env.OPENAI_API_KEY || '',
    };

    this.client = new OpenAI({
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

    // Convert to OpenAI message format
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    const completion = await this.client.chat.completions.create({
      model,
      messages: openaiMessages,
      max_tokens: maxTokens,
      temperature,
    });

    const content = completion.choices[0]?.message?.content || '';

    return {
      content,
      model: completion.model,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  }

  async checkConnection(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      await this.client.chat.completions.create({
        model: this.config.models.validation,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
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
