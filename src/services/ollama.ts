import type { ChatMessage, StreamChunk } from '../types';

const DEFAULT_BASE_URL = 'http://localhost:11434';

interface OllamaChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
}

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
}

interface OllamaTagsResponse {
  models: Array<{ name: string; model: string; modified_at: string }>;
}

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  private convertMessages(
    messages: ChatMessage[]
  ): Array<{ role: string; content: string }> {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Parse content that may contain <think>...</think> tags from reasoning models.
   * Returns separate thinking and text chunks.
   */
  private parseThinkTags(
    content: string,
    inThinking: boolean
  ): { chunks: StreamChunk[]; inThinking: boolean } {
    const chunks: StreamChunk[] = [];
    let remaining = content;
    let currentlyThinking = inThinking;

    while (remaining.length > 0) {
      if (currentlyThinking) {
        const closeIdx = remaining.indexOf('</think>');
        if (closeIdx === -1) {
          // Still thinking, yield all as thinking
          chunks.push({ content: remaining, done: false, type: 'thinking' });
          remaining = '';
        } else {
          // Yield thinking up to close tag, then switch to text
          const thinkPart = remaining.slice(0, closeIdx);
          if (thinkPart) {
            chunks.push({ content: thinkPart, done: false, type: 'thinking' });
          }
          remaining = remaining.slice(closeIdx + '</think>'.length);
          currentlyThinking = false;
        }
      } else {
        const openIdx = remaining.indexOf('<think>');
        if (openIdx === -1) {
          // No thinking, yield all as text
          chunks.push({ content: remaining, done: false, type: 'text' });
          remaining = '';
        } else {
          // Yield text up to open tag, then switch to thinking
          const textPart = remaining.slice(0, openIdx);
          if (textPart) {
            chunks.push({ content: textPart, done: false, type: 'text' });
          }
          remaining = remaining.slice(openIdx + '<think>'.length);
          currentlyThinking = true;
        }
      }
    }

    return { chunks, inThinking: currentlyThinking };
  }

  async *stream(
    messages: ChatMessage[],
    model: string
  ): AsyncGenerator<StreamChunk> {
    const body: OllamaChatRequest = {
      model,
      messages: this.convertMessages(messages),
      stream: true,
    };

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Connection failed';
      throw new Error(
        `Ollama connection failed (${this.baseUrl}): ${message}. Is Ollama running?`
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Ollama API error ${response.status}: ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error('Ollama returned no response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let inThinking = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse NDJSON: each line is a separate JSON object.
        const lines = buffer.split('\n');
        // Keep the last (possibly incomplete) line in the buffer.
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed: OllamaChatResponse = JSON.parse(trimmed);
            if (parsed.message?.content) {
              // Parse <think> tags from reasoning models (DeepSeek-R1, etc.)
              const result = this.parseThinkTags(parsed.message.content, inThinking);
              inThinking = result.inThinking;
              for (const chunk of result.chunks) {
                yield chunk;
              }
            }
            if (parsed.done) {
              yield { content: '', done: true };
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Process any remaining data in the buffer.
      if (buffer.trim()) {
        try {
          const parsed: OllamaChatResponse = JSON.parse(buffer.trim());
          if (parsed.message?.content) {
            const result = this.parseThinkTags(parsed.message.content, inThinking);
            for (const chunk of result.chunks) {
              yield chunk;
            }
          }
          if (parsed.done) {
            yield { content: '', done: true };
          }
        } catch {
          // Skip malformed final chunk
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async complete(messages: ChatMessage[], model: string): Promise<string> {
    const body: OllamaChatRequest = {
      model,
      messages: this.convertMessages(messages),
      stream: false,
    };

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Connection failed';
      throw new Error(
        `Ollama connection failed (${this.baseUrl}): ${message}. Is Ollama running?`
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Ollama API error ${response.status}: ${errorText}`
      );
    }

    const data: OllamaChatResponse = await response.json();
    return data.message?.content ?? '';
  }

  async listModels(): Promise<string[]> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Connection failed';
      throw new Error(
        `Ollama connection failed (${this.baseUrl}): ${message}. Is Ollama running?`
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Ollama API error ${response.status}: ${errorText}`
      );
    }

    const data: OllamaTagsResponse = await response.json();
    return data.models.map((m) => m.name);
  }
}
