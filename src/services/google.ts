import {
  GoogleGenerativeAI,
  type Content,
  type Part,
} from '@google/generative-ai';
import type { ChatMessage, StreamChunk } from '../types';

export class GoogleService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Convert ChatMessage[] to Google's Content format.
   * - System messages become the systemInstruction on the model.
   * - user -> role "user", assistant -> role "model".
   * - Google requires alternating user/model turns starting with user.
   */
  private convertMessages(messages: ChatMessage[]): {
    systemInstruction: string | undefined;
    history: Content[];
    lastUserMessage: string;
  } {
    let systemInstruction: string | undefined;
    const nonSystemMessages: Array<{ role: 'user' | 'model'; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = systemInstruction
          ? `${systemInstruction}\n\n${msg.content}`
          : msg.content;
      } else {
        nonSystemMessages.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          content: msg.content,
        });
      }
    }

    // Google requires the conversation to start with a user turn.
    if (nonSystemMessages.length > 0 && nonSystemMessages[0].role === 'model') {
      nonSystemMessages.unshift({ role: 'user', content: 'Continue.' });
    }

    // Merge consecutive same-role messages for alternation compliance.
    const merged: Array<{ role: 'user' | 'model'; content: string }> = [];
    for (const msg of nonSystemMessages) {
      if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
        merged[merged.length - 1].content += '\n\n' + msg.content;
      } else {
        merged.push({ ...msg });
      }
    }

    // If there are no messages at all, provide a default.
    if (merged.length === 0) {
      merged.push({ role: 'user', content: 'Hello.' });
    }

    // The last message must be from the user for sendMessage/sendMessageStream.
    // If the last message is from the model, append a placeholder user turn.
    if (merged[merged.length - 1].role === 'model') {
      merged.push({ role: 'user', content: 'Continue.' });
    }

    // Split into history (all but last) and the last user message.
    const lastUserMessage = merged[merged.length - 1].content;
    const historyMessages = merged.slice(0, -1);

    const history: Content[] = historyMessages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content } as Part],
    }));

    return { systemInstruction, history, lastUserMessage };
  }

  async *stream(
    messages: ChatMessage[],
    model: string,
    maxTokens: number = 4096
  ): AsyncGenerator<StreamChunk> {
    const { systemInstruction, history, lastUserMessage } =
      this.convertMessages(messages);

    try {
      const generativeModel = this.genAI.getGenerativeModel({
        model,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig: {
          maxOutputTokens: maxTokens,
        },
      });

      const chat = generativeModel.startChat({ history });
      const result = await chat.sendMessageStream(lastUserMessage);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield { content: text, done: false };
        }
      }

      yield { content: '', done: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown Google AI error';
      throw new Error(`Google AI streaming failed: ${message}`);
    }
  }

  async complete(
    messages: ChatMessage[],
    model: string,
    maxTokens: number = 4096
  ): Promise<string> {
    const { systemInstruction, history, lastUserMessage } =
      this.convertMessages(messages);

    try {
      const generativeModel = this.genAI.getGenerativeModel({
        model,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig: {
          maxOutputTokens: maxTokens,
        },
      });

      const chat = generativeModel.startChat({ history });
      const result = await chat.sendMessage(lastUserMessage);
      return result.response.text();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown Google AI error';
      throw new Error(`Google AI completion failed: ${message}`);
    }
  }
}
