import OpenAI from 'openai';
import type { ChatMessage, StreamChunk } from '../types';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new OpenAI({
      apiKey,
      ...(baseUrl ? { baseURL: baseUrl } : {}),
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
        const delta = chunk.choices[0]?.delta as any;

        // Capture reasoning tokens from o1/o3 models
        if (delta?.reasoning_content) {
          yield { content: delta.reasoning_content, done: false, type: 'thinking' };
        }

        if (delta?.content) {
          yield { content: delta.content, done: false, type: 'text' };
        }
        if (chunk.choices[0]?.finish_reason) {
          yield { content: '', done: true };
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown OpenAI API error';
      throw new Error(`OpenAI streaming failed: ${message}`);
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
        error instanceof Error ? error.message : 'Unknown OpenAI API error';
      throw new Error(`OpenAI completion failed: ${message}`);
    }
  }
}
