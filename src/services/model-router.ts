import type { ApiKeys, ChatMessage, ModelProvider, StreamChunk } from '../types';
import { AnthropicService } from './anthropic';
import { OpenAIService } from './openai';
import { GoogleService } from './google';
import { OllamaService } from './ollama';
import { LMStudioService } from './lmstudio';

type ServiceInstance =
  | AnthropicService
  | OpenAIService
  | GoogleService
  | OllamaService
  | LMStudioService;

export class ModelRouter {
  private apiKeys: ApiKeys;
  private localEndpoints: { ollama?: string; lmstudio?: string };
  private services: Partial<Record<ModelProvider, ServiceInstance>> = {};

  constructor(
    apiKeys: ApiKeys,
    localEndpoints: { ollama?: string; lmstudio?: string } = {}
  ) {
    this.apiKeys = apiKeys;
    this.localEndpoints = localEndpoints;
  }

  /**
   * Update API keys at runtime (e.g., when the user changes settings).
   * Clears cached service instances for providers whose keys changed.
   */
  updateApiKeys(apiKeys: ApiKeys): void {
    const changedProviders: ModelProvider[] = [];

    if (apiKeys.anthropic !== this.apiKeys.anthropic) changedProviders.push('anthropic');
    if (apiKeys.openai !== this.apiKeys.openai) changedProviders.push('openai');
    if (apiKeys.google !== this.apiKeys.google) changedProviders.push('google');
    if (apiKeys.mistral !== this.apiKeys.mistral) changedProviders.push('mistral');
    if (apiKeys.groq !== this.apiKeys.groq) changedProviders.push('groq');

    this.apiKeys = { ...apiKeys };

    for (const provider of changedProviders) {
      delete this.services[provider];
    }
  }

  /**
   * Update local endpoints at runtime.
   * Clears cached service instances for affected local providers.
   */
  updateLocalEndpoints(endpoints: { ollama?: string; lmstudio?: string }): void {
    if (endpoints.ollama !== this.localEndpoints.ollama) {
      delete this.services.ollama;
    }
    if (endpoints.lmstudio !== this.localEndpoints.lmstudio) {
      delete this.services.lmstudio;
    }
    this.localEndpoints = { ...endpoints };
  }

  /**
   * Lazily instantiate and return the service for the given provider.
   */
  getService(provider: ModelProvider): ServiceInstance {
    // Return cached instance if available.
    if (this.services[provider]) {
      return this.services[provider]!;
    }

    let service: ServiceInstance;

    switch (provider) {
      case 'anthropic': {
        const key = this.apiKeys.anthropic;
        if (!key) throw new Error('Anthropic API key is not configured.');
        service = new AnthropicService(key);
        break;
      }
      case 'openai': {
        const key = this.apiKeys.openai;
        if (!key) throw new Error('OpenAI API key is not configured.');
        service = new OpenAIService(key);
        break;
      }
      case 'google': {
        const key = this.apiKeys.google;
        if (!key) throw new Error('Google AI API key is not configured.');
        service = new GoogleService(key);
        break;
      }
      case 'mistral': {
        // Mistral uses an OpenAI-compatible API.
        const key = this.apiKeys.mistral;
        if (!key) throw new Error('Mistral API key is not configured.');
        service = new OpenAIService(key, 'https://api.mistral.ai/v1');
        break;
      }
      case 'groq': {
        // Groq uses an OpenAI-compatible API.
        const key = this.apiKeys.groq;
        if (!key) throw new Error('Groq API key is not configured.');
        service = new OpenAIService(key, 'https://api.groq.com/openai/v1');
        break;
      }
      case 'ollama': {
        service = new OllamaService(this.localEndpoints.ollama);
        break;
      }
      case 'lmstudio': {
        service = new LMStudioService(this.localEndpoints.lmstudio);
        break;
      }
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Unknown model provider: ${_exhaustive}`);
      }
    }

    this.services[provider] = service;
    return service;
  }

  async *stream(
    provider: ModelProvider,
    messages: ChatMessage[],
    model: string,
    maxTokens?: number
  ): AsyncGenerator<StreamChunk> {
    const service = this.getService(provider);

    switch (provider) {
      case 'ollama': {
        yield* (service as OllamaService).stream(messages, model);
        return;
      }
      case 'lmstudio': {
        yield* (service as LMStudioService).stream(
          messages,
          model,
          maxTokens ?? 4096
        );
        return;
      }
      case 'anthropic': {
        yield* (service as AnthropicService).stream(
          messages,
          model,
          maxTokens ?? 4096
        );
        return;
      }
      case 'openai':
      case 'mistral':
      case 'groq': {
        yield* (service as OpenAIService).stream(
          messages,
          model,
          maxTokens ?? 4096
        );
        return;
      }
      case 'google': {
        yield* (service as GoogleService).stream(
          messages,
          model,
          maxTokens ?? 4096
        );
        return;
      }
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Unknown model provider: ${_exhaustive}`);
      }
    }
  }

  async complete(
    provider: ModelProvider,
    messages: ChatMessage[],
    model: string,
    maxTokens?: number
  ): Promise<string> {
    const service = this.getService(provider);

    switch (provider) {
      case 'ollama': {
        return (service as OllamaService).complete(messages, model);
      }
      case 'lmstudio': {
        return (service as LMStudioService).complete(
          messages,
          model,
          maxTokens ?? 4096
        );
      }
      case 'anthropic': {
        return (service as AnthropicService).complete(
          messages,
          model,
          maxTokens ?? 4096
        );
      }
      case 'openai':
      case 'mistral':
      case 'groq': {
        return (service as OpenAIService).complete(
          messages,
          model,
          maxTokens ?? 4096
        );
      }
      case 'google': {
        return (service as GoogleService).complete(
          messages,
          model,
          maxTokens ?? 4096
        );
      }
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Unknown model provider: ${_exhaustive}`);
      }
    }
  }
}
