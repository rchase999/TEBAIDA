import { describe, it, expect } from 'vitest';
import { OllamaService } from '../src/services/ollama';

describe('OllamaService - Think Tag Parsing', () => {
  // Access the private method for testing via prototype
  const service = new OllamaService('http://localhost:11434');
  const parseThinkTags = (service as any).parseThinkTags.bind(service);

  it('returns plain text as type text', () => {
    const result = parseThinkTags('Hello world', false);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]).toEqual({ content: 'Hello world', done: false, type: 'text' });
    expect(result.inThinking).toBe(false);
  });

  it('parses <think> tags into thinking chunks', () => {
    const result = parseThinkTags('<think>reasoning here</think>response here', false);
    expect(result.chunks).toHaveLength(2);
    expect(result.chunks[0]).toEqual({ content: 'reasoning here', done: false, type: 'thinking' });
    expect(result.chunks[1]).toEqual({ content: 'response here', done: false, type: 'text' });
    expect(result.inThinking).toBe(false);
  });

  it('handles incomplete think tag (streaming)', () => {
    const result = parseThinkTags('<think>partial reasoning', false);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0].type).toBe('thinking');
    expect(result.chunks[0].content).toBe('partial reasoning');
    expect(result.inThinking).toBe(true);
  });

  it('continues thinking state across calls', () => {
    const result1 = parseThinkTags('<think>start', false);
    expect(result1.inThinking).toBe(true);

    const result2 = parseThinkTags(' more thinking</think>now responding', result1.inThinking);
    expect(result2.chunks).toHaveLength(2);
    expect(result2.chunks[0]).toEqual({ content: ' more thinking', done: false, type: 'thinking' });
    expect(result2.chunks[1]).toEqual({ content: 'now responding', done: false, type: 'text' });
    expect(result2.inThinking).toBe(false);
  });

  it('handles multiple think blocks', () => {
    const result = parseThinkTags('<think>thought 1</think>text 1<think>thought 2</think>text 2', false);
    expect(result.chunks).toEqual([
      { content: 'thought 1', done: false, type: 'thinking' },
      { content: 'text 1', done: false, type: 'text' },
      { content: 'thought 2', done: false, type: 'thinking' },
      { content: 'text 2', done: false, type: 'text' },
    ]);
  });

  it('handles empty content', () => {
    const result = parseThinkTags('', false);
    expect(result.chunks).toHaveLength(0);
    expect(result.inThinking).toBe(false);
  });

  it('handles think tags with no content between them', () => {
    const result = parseThinkTags('<think></think>hello', false);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]).toEqual({ content: 'hello', done: false, type: 'text' });
  });
});
