import { OpenAI } from 'openai';
import { ILLMProvider } from '../llm.interface.js';
import { ClassificationResult, ClassificationResultSchema, EmailMessage } from '../../../domain/types.js';
import { config } from '../../../config/env.js';
import { PromptBuilder } from '../prompt.builder.js';
import { Logger } from '../../logger.js';

export class OpenAICompatProvider implements ILLMProvider {
  private client: OpenAI;
  private model: string;
  private providerName: string;

  constructor(isOllama: boolean) {
    this.providerName = isOllama ? 'Ollama' : 'OpenAI';
    this.model = isOllama ? config.OLLAMA_MODEL : 'gpt-4o-mini';

    this.client = new OpenAI({
      apiKey: isOllama ? 'ollama' : config.OPENAI_API_KEY || 'missing',
      baseURL: isOllama ? config.OLLAMA_BASE_URL : undefined,
    });
  }

  // Classify email message using openai compatible models
  async classify(email: EmailMessage): Promise<ClassificationResult> {
    const prompt = PromptBuilder.buildClassificationPrompt(email, true);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      return ClassificationResultSchema.parse(JSON.parse(content));
    } catch (error) {
      Logger.error(this.providerName, 'Classification failed, falling back to Misc:', error);
      return { category: 'Misc', summary: email.subject?.trim() || 'General notification' };
    }
  }
}
