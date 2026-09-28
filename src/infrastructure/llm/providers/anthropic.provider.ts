import Anthropic from '@anthropic-ai/sdk';
import { ILLMProvider } from '../llm.interface.js';
import { ClassificationResult, ClassificationResultSchema, EmailMessage } from '../../../domain/types.js';
import { config } from '../../../config/env.js';
import { PromptBuilder } from '../prompt.builder.js';
import { Logger } from '../../logger.js';

export class AnthropicProvider implements ILLMProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY || 'missing',
    });
  }

  // Classify email message using claude models
  async classify(email: EmailMessage): Promise<ClassificationResult> {
    const prompt = PromptBuilder.buildClassificationPrompt(email, true);

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content.find((block) => block.type === 'text');
      const content = text && text.type === 'text' ? text.text : '{}';
      return ClassificationResultSchema.parse(JSON.parse(content));
    } catch (error) {
      Logger.error('Anthropic', 'Classification failed, falling back to Misc:', error);
      return { category: 'Misc', summary: email.subject?.trim() || 'General notification' };
    }
  }
}
