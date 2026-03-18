import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage, StreamChunk } from '../types';

export class AnthropicService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  /**
   * Convert ChatMessage[] into Anthropic's expected format:
   * - System message is extracted and passed separately.
   * - Remaining messages must alternate user/assistant with user first.
   */
  private convertMessages(messages: ChatMessage[]): {
    system: string | undefined;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    let system: string | undefined;
    const converted: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Concatenate multiple system messages if present
        system = system ? `${system}\n\n${msg.content}` : msg.content;
      } else {
        converted.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Anthropic requires the first message to be from the user.
    if (converted.length > 0 && converted[0].role === 'assistant') {
      converted.unshift({ role: 'user', content: 'Continue.' });
    }

    // Anthropic requires strict user/assistant alternation.
    // Merge consecutive same-role messages.
    const merged: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const msg of converted) {
      if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
        merged[merged.length - 1].content += '\n\n' + msg.content;
      } else {
        merged.push({ ...msg });
      }
    }

    return { system, messages: merged };
  }

  async *stream(
    messages: ChatMessage[],
    model: string,
    maxTokens: number = 4096
  ): AsyncGenerator<StreamChunk> {
    const { system, messages: converted } = this.convertMessages(messages);

    // Check if model supports extended thinking (Claude 3.5+ sonnet/opus, Claude 4+)
    const supportsThinking = /claude-(3-5|4|sonnet-4|opus-4)/.test(model);

    try {
      const params: any = {
        model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: converted,
      };

      // Enable extended thinking for supported models
      if (supportsThinking) {
        params.thinking = { type: 'enabled', budget_tokens: Math.min(4096, maxTokens) };
        // Extended thinking requires at least budget_tokens + 1 for max_tokens
        params.max_tokens = Math.max(maxTokens, 8192);
      }

      const stream = this.client.messages.stream(params);

      for await (const event of stream) {
        // Handle thinking blocks
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'thinking_delta'
        ) {
          yield { content: (event.delta as any).thinking, done: false, type: 'thinking' };
        }

        // Handle text blocks
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield { content: event.delta.text, done: false, type: 'text' };
        }
      }

      yield { content: '', done: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown Anthropic API error';
      throw new Error(`Anthropic streaming failed: ${message}`);
    }
  }

  async complete(
    messages: ChatMessage[],
    model: string,
    maxTokens: number = 4096
  ): Promise<string> {
    const { system, messages: converted } = this.convertMessages(messages);

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: converted,
      });

      const textBlocks = response.content.filter(
        (block) => block.type === 'text'
      );
      return textBlocks.map((block) => block.text).join('');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown Anthropic API error';
      throw new Error(`Anthropic completion failed: ${message}`);
    }
  }
}
