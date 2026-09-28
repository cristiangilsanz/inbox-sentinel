import { GoogleGenAI } from '@google/genai';
import { ILLMProvider } from '../llm.interface.js';
import { ClassificationResult, ClassificationResultSchema, EmailMessage } from '../../../domain/types.js';
import { config } from '../../../config/env.js';
import { PromptBuilder } from '../prompt.builder.js';
import { CATEGORY_NAMES } from '../../../domain/categories.js';
import { Logger } from '../../logger.js';

export class GeminiProvider implements ILLMProvider {
  private ai: GoogleGenAI;
  private candidateModels: string[];

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY || 'missing' });
    this.candidateModels = Array.from(
      new Set([
        config.GEMINI_MODEL,
        'gemini-3.5-flash-lite',
        'gemini-3-flash-preview',
        'gemini-3.5-flash',
      ])
    );
  }

  // Classify email message using gemini models with resilient candidate failover
  async classify(email: EmailMessage): Promise<ClassificationResult> {
    const prompt = PromptBuilder.buildClassificationPrompt(email, false);
    let lastError: unknown;

    for (const model of this.candidateModels) {
      const maxRetries = 2;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    enum: CATEGORY_NAMES as string[],
                  },
                  summary: { type: 'string' },
                },
                required: ['category', 'summary'],
              } as any,
            },
          });

          const content = response.text || '{}';
          return ClassificationResultSchema.parse(JSON.parse(content));
        } catch (error: any) {
          lastError = error;
          const isTemporary = error?.status === 503 || error?.status === 429;
          if (isTemporary && attempt < maxRetries) {
            const delayMs = attempt * 1000;
            Logger.warn('Gemini', `Model ${model} busy (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }
          Logger.warn('Gemini', `Model ${model} failed (status ${error?.status || 'error'}), trying next candidate...`);
          break;
        }
      }
    }

    Logger.error('Gemini', 'All candidate models failed, falling back to Misc:', lastError);
    return { category: 'Misc', summary: email.subject?.trim() || 'General notification' };
  }
}
