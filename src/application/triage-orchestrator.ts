import { GmailClient } from '../infrastructure/gmail/gmail.client.js';
import { TelegramClient } from '../infrastructure/telegram/telegram.client.js';
import { LLMFactory } from '../infrastructure/llm/llm.factory.js';
import { EmailMessage, TriageAction, TriageSummaryItem } from '../domain/types.js';
import { Logger } from '../infrastructure/logger.js';

export class TriageOrchestrator {
  constructor(
    private readonly gmailClient = new GmailClient(),
    private readonly telegramClient = new TelegramClient()
  ) {}

  // Run standalone email triage workflow
  async runStandalone(limit?: number): Promise<{ status: string; processed: number; message?: string }> {
    Logger.start('Triager', 'Starting email triage workflow...');
    const emails = await this.gmailClient.fetchUncategorizedEmails(limit);
    if (emails.length === 0) {
      Logger.info('Triager', 'No unclassified emails found in inbox.');
      return { status: 'success', processed: 0, message: 'No new unclassified emails to process.' };
    }

    Logger.progress('Triager', `Processing ${emails.length} unclassified email(s)...`);
    const llmProvider = LLMFactory.createProvider();
    const summaryItems: TriageSummaryItem[] = [];

    for (const email of emails) {
      const result = await llmProvider.classify(email);
      await this.gmailClient.applyCategoryLabel(email.id, result.category);

      summaryItems.push({
        category: result.category,
        from: email.from,
        summary: result.summary,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    await this.telegramClient.sendSummary(summaryItems);
    Logger.success('Triager', `Triage completed: ${summaryItems.length} email(s) processed.`);
    return { status: 'success', processed: summaryItems.length };
  }

  // Fetch unclassified emails for agent
  async fetchForAgent(limit?: number): Promise<EmailMessage[]> {
    return await this.gmailClient.fetchUncategorizedEmails(limit);
  }

  // Apply triage actions and dispatch summary
  async applyAgentActions(actions: TriageAction[]): Promise<{ status: string; applied: number }> {
    Logger.start('Agent', `Applying ${actions.length} triage action(s)...`);
    const summaryItems: TriageSummaryItem[] = [];

    for (const action of actions) {
      await this.gmailClient.applyCategoryLabel(action.emailId, action.category);
      summaryItems.push({
        category: action.category,
        from: action.from || 'Email Notification',
        summary: action.summary,
      });
    }

    await this.telegramClient.sendSummary(summaryItems);
    Logger.success('Agent', `Successfully applied ${actions.length} action(s).`);
    return { status: 'success', applied: actions.length };
  }

  // Run Sweeper to clean Misc emails and send Telegram notification
  async runSweeper(): Promise<{ status: string; deleted: number }> {
    Logger.start('Sweeper', 'Starting Misc email cleanup...');
    const deleted = await this.gmailClient.deleteMiscEmails();
    await this.telegramClient.sendSweeperNotification(deleted);
    Logger.success('Sweeper', `Cleanup completed: ${deleted} email(s) removed.`);
    return { status: 'success', deleted };
  }

  // Alias for backward compatibility
  async runWeeklyCleanup(): Promise<{ status: string; deleted: number }> {
    return await this.runSweeper();
  }
}
