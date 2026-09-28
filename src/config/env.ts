import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const ConfigSchema = z.object({
  AI_PROVIDER: z.enum(['ollama', 'openai', 'anthropic', 'gemini']).default('ollama'),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434/v1'),
  OLLAMA_MODEL: z.string().default('llama3.2:latest'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GMAIL_CREDENTIALS_PATH: z.string().default('./credentials.json'),
  GMAIL_TOKEN_PATH: z.string().default('./token.json'),
  GMAIL_CREDENTIALS_JSON: z.string().optional(),
  GMAIL_TOKEN_JSON: z.string().optional(),
  ARCHIVE_AFTER_TRIAGE: z.coerce.boolean().default(false),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;
export const config = ConfigSchema.parse(process.env);
