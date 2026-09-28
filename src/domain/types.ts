import { z } from 'zod';
import { CATEGORY_NAMES } from './categories.js';

export type ValidCategory = string;

export const ClassificationResultSchema = z.object({
  category: z.string().refine((val) => CATEGORY_NAMES.includes(val), {
    message: 'Category must be one of the configured categories in categories.yaml',
  }),
  summary: z.string(),
});

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  date?: string;
  to?: string;
  replyTo?: string;
  listId?: string;
  bodySnippet: string;
}

export const TriageActionSchema = z.object({
  emailId: z.string().min(1, 'emailId is required'),
  category: z.string().refine((val) => CATEGORY_NAMES.includes(val), {
    message: 'Category must be one of the configured categories in categories.yaml',
  }),
  summary: z.string().min(1, 'summary is required'),
  from: z.string().optional(),
});

export const TriageActionsArraySchema = z.array(TriageActionSchema);

export type TriageAction = z.infer<typeof TriageActionSchema>;

export interface TriageSummaryItem {
  category: ValidCategory;
  from: string;
  summary: string;
}
