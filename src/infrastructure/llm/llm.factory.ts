import { ILLMProvider } from './llm.interface.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { AnthropicProvider } from './providers/anthropic.provider.js';
import { OpenAICompatProvider } from './providers/openai-compat.provider.js';
import { config } from '../../config/env.js';

export class LLMFactory {
  // Create configured language model provider instance
  static createProvider(): ILLMProvider {
    switch (config.AI_PROVIDER) {
      case 'gemini':
        return new GeminiProvider();
      case 'anthropic':
        return new AnthropicProvider();
      case 'openai':
        return new OpenAICompatProvider(false);
      case 'ollama':
        return new OpenAICompatProvider(true);
      default:
        throw new Error(`Unsupported AI_PROVIDER: ${config.AI_PROVIDER}`);
    }
  }
}
