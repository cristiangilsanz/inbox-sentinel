import { TriageSummaryItem } from '../../domain/types.js';

export class TelegramFormatter {
  // Build triager markdown summary message
  static buildTriagerMessage(items: TriageSummaryItem[]): string {
    if (items.length === 0) return '';

    let message = `📬 *Triager Summary* (${items.length} email(s) processed)\n\n`;

    for (const item of items) {
      const cleanFrom = item.from.replace(/[\*\_\`\[\]\(\)]/g, '').trim();
      let cleanSummary = item.summary.replace(/[\*\_\`\[\]\(\)]/g, '').trim();
      if (/error during classification|failed after retries/i.test(cleanSummary)) {
        cleanSummary = 'General notification';
      }
      message += `• *[${item.category}]* ${cleanFrom}\n  ↳ _${cleanSummary}_\n`;
    }

    return message.trimEnd();
  }

  // Alias for backward compatibility
  static buildSummaryMessage(items: TriageSummaryItem[]): string {
    return this.buildTriagerMessage(items);
  }

  // Build sweeper markdown summary message
  static buildSweeperMessage(deletedCount: number): string {
    return `🧹 *Sweeper Summary* (${deletedCount} email(s) removed)`;
  }
}
