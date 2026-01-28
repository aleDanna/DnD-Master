/**
 * Gemini LLM Provider
 * Implementation using Google's Gemini models
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type {
  ILLMProvider,
  LLMMessage,
  LLMRequestOptions,
  LLMResponse,
  LLMProviderConfig,
} from './types.js';

const DEFAULT_CONFIG: LLMProviderConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  defaultModel: 'gemini-1.5-pro',
  models: {
    narrative: 'gemini-1.5-pro',
    validation: 'gemini-1.5-flash',
    combat: 'gemini-1.5-pro',
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

export class GeminiProvider implements ILLMProvider {
  readonly name = 'gemini' as const;
  private client: GoogleGenerativeAI;
  private config: LLMProviderConfig;

  constructor(apiKey?: string) {
    this.config = {
      ...DEFAULT_CONFIG,
      apiKey: apiKey || process.env.GEMINI_API_KEY || '',
    };

    this.client = new GoogleGenerativeAI(this.config.apiKey);
  }

  private getModel(modelName: string, options: LLMRequestOptions = {}): GenerativeModel {
    const { maxTokens, temperature } = options;

    return this.client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
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

    const geminiModel = this.getModel(model, { maxTokens, temperature });

    // Build conversation history for Gemini
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage?.content || '';

    // For Gemini, we use systemInstruction for the system prompt
    const chat = geminiModel.startChat({
      history: history.length > 0 ? history as any : undefined,
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(userContent);
    const response = result.response;
    const content = response.text();

    const usageMetadata = response.usageMetadata;

    return {
      content,
      model,
      usage: usageMetadata
        ? {
            promptTokens: usageMetadata.promptTokenCount || 0,
            completionTokens: usageMetadata.candidatesTokenCount || 0,
            totalTokens: usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  }

  async checkConnection(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const model = this.getModel(this.config.models.validation, {
        maxTokens: 5,
        temperature: 0,
      });
      await model.generateContent('ping');
      return true;
    } catch {
      return false;
    }
  }

  getConfig(): LLMProviderConfig {
    return { ...this.config };
  }
}
