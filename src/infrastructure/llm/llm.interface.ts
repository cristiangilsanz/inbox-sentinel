import { ClassificationResult, EmailMessage } from '../../domain/types.js';

export interface ILLMProvider {
  classify(email: EmailMessage): Promise<ClassificationResult>;
}
