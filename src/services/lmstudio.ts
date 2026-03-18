import OpenAI from 'openai';
import type { ChatMessage, StreamChunk } from '../types';

const DEFAULT_BASE_URL = 'http://localhost:1234/v1';

export class LMStudioService {
  private client: OpenAI;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.client = new OpenAI({
      apiKey: 'lm-studio', // LM Studio does not require a real API key
      baseURL: this.baseUrl,
      dangerouslyAllowBrowser: true,
    });
  }

  async *stream(
    messages: ChatMessage[],
    model: string,
    maxTokens: number = 4096
  ): AsyncGenerator<StreamChunk> {
    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield { content: delta.content, done: false };
        }
        if (chunk.choices[0]?.finish_reason) {
          yield { content: '', done: true };
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown LM Studio error';
      throw new Error(
        `LM Studio streaming failed (${this.baseUrl}): ${message}. Is LM Studio running?`
      );
    }
  }

  async complete(
    messages: ChatMessage[],
    model: string,
    maxTokens: number = 4096
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: maxTokens,
      });

      return response.choices[0]?.message?.content ?? '';
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown LM Studio error';
      throw new Error(
        `LM Studio completion failed (${this.baseUrl}): ${message}. Is LM Studio running?`
      );
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      const models: string[] = [];
      for await (const model of response) {
        models.push(model.id);
      }
      return models;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown LM Studio error';
      throw new Error(
        `LM Studio listModels failed (${this.baseUrl}): ${message}. Is LM Studio running?`
      );
    }
  }
}
