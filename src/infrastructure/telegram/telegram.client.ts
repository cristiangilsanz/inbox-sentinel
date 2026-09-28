import { config } from '../../config/env.js';
import { TriageSummaryItem } from '../../domain/types.js';
import { TelegramFormatter } from './telegram.formatter.js';
import { Logger } from '../logger.js';

export class TelegramClient {
  private botToken: string | undefined;
  private chatId: string | undefined;

  constructor() {
    this.botToken = config.TELEGRAM_BOT_TOKEN;
    this.chatId = config.TELEGRAM_CHAT_ID;
  }

  // Send raw markdown message to telegram
  async sendMessage(message: string): Promise<void> {
    if (!this.botToken || !this.chatId) {
      Logger.info('Telegram', 'Bot credentials not configured, skipping notification.');
      return;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        Logger.error('Telegram', `Failed to send message: ${errorBody}`);
      } else {
        Logger.success('Telegram', 'Notification dispatched successfully.');
      }
    } catch (error) {
      Logger.error('Telegram', 'Network failure sending message:', error);
    }
  }

  // Send triage summary notification to telegram
  async sendSummary(items: TriageSummaryItem[]): Promise<void> {
    if (items.length === 0) return;
    const message = TelegramFormatter.buildTriagerMessage(items);
    await this.sendMessage(message);
  }

  // Send Sweeper notification to telegram
  async sendSweeperNotification(deletedCount: number): Promise<void> {
    const message = TelegramFormatter.buildSweeperMessage(deletedCount);
    await this.sendMessage(message);
  }

  // Alias for backward compatibility
  async sendCleanupNotification(deletedCount: number): Promise<void> {
    await this.sendSweeperNotification(deletedCount);
  }
}
