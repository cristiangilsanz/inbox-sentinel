import { google, gmail_v1 } from 'googleapis';
import fs from 'fs/promises';
import { config } from '../../config/env.js';
import { EmailMessage } from '../../domain/types.js';
import { CATEGORY_NAMES } from '../../domain/categories.js';
import { MimeParser } from './mime.parser.js';
import { Logger } from '../logger.js';

export class GmailClient {
  private auth = new google.auth.OAuth2();
  private gmail: gmail_v1.Gmail | null = null;

  // Authenticate oauth client with saved credentials
  async authenticate(): Promise<void> {
    try {
      let content = config.GMAIL_CREDENTIALS_JSON;
      if (!content) {
        content = await fs.readFile(config.GMAIL_CREDENTIALS_PATH, 'utf-8');
      }
      const credentials = JSON.parse(content);
      const clientInfo = credentials.installed || credentials.web || credentials;

      if (!clientInfo?.client_secret || !clientInfo?.client_id) {
        if (credentials.refresh_token || credentials.access_token) {
          throw new Error(
            'GMAIL_CREDENTIALS_JSON contains OAuth token data instead of client credentials. Please check your GitHub Secrets.'
          );
        }
        throw new Error(
          'Invalid credentials format: client_id or client_secret missing. Ensure GMAIL_CREDENTIALS_JSON contains credentials from Google Cloud Console.'
        );
      }

      const { client_secret, client_id, redirect_uris } = clientInfo;
      const redirectUri = redirect_uris?.[0] || 'http://localhost:3000/oauth2callback';
      this.auth = new google.auth.OAuth2(client_id, client_secret, redirectUri);

      try {
        let tokenContent = config.GMAIL_TOKEN_JSON;
        if (!tokenContent) {
          tokenContent = await fs.readFile(config.GMAIL_TOKEN_PATH, 'utf-8');
        }
        const tokenData = JSON.parse(tokenContent);
        if (tokenData.installed || tokenData.web) {
          throw new Error(
            'GMAIL_TOKEN_JSON contains OAuth client credentials instead of token data. Please check your GitHub Secrets.'
          );
        }
        this.auth.setCredentials(tokenData);
      } catch (err: any) {
        throw new Error(
          err.message || `Token file not found at ${config.GMAIL_TOKEN_PATH}. Please run "npm run auth" to authorize.`
        );
      }

      this.gmail = google.gmail({ version: 'v1', auth: this.auth });
    } catch (error) {
      Logger.error('Gmail', 'Error loading Gmail credentials:', error);
      throw error;
    }
  }

  // Fetch uncategorized messages from inbox
  async fetchUncategorizedEmails(limit?: number): Promise<EmailMessage[]> {
    if (!this.gmail) await this.authenticate();

    try {
      const labelsRes = await this.gmail!.users.labels.list({ userId: 'me' });
    const existingLabels = labelsRes.data.labels || [];
    const categoryLabels = existingLabels.filter(
      (l) => l.name && CATEGORY_NAMES.includes(l.name)
    );
    const categoryLabelIds = new Set(categoryLabels.map((l) => l.id!));

    const excludeLabelsQuery = categoryLabels
      .map((l) => `-label:"${l.name}"`)
      .join(' ');

    const query = `in:inbox -label:Spam -label:Trash ${excludeLabelsQuery}`.trim();

    const messageRefs: gmail_v1.Schema$Message[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const pageSize = limit ? Math.min(limit - messageRefs.length, 100) : 100;
      const res: any = await this.gmail!.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: pageSize,
        pageToken,
      });

      if (res.data.messages) {
        messageRefs.push(...res.data.messages);
      }

      pageToken = res.data.nextPageToken || undefined;
      if (limit && messageRefs.length >= limit) break;
    } while (pageToken);

    const results: EmailMessage[] = [];

    for (const msg of messageRefs) {
      if (!msg.id) continue;
      if (limit && results.length >= limit) break;

      const fullMsg = await this.gmail!.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const labelIds = fullMsg.data.labelIds || [];
      const isAlreadyClassified = labelIds.some((id) => categoryLabelIds.has(id));
      if (isAlreadyClassified) continue;

      const headers = fullMsg.data.payload?.headers || [];
      const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
      const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
      const to = headers.find((h) => h.name?.toLowerCase() === 'to')?.value || undefined;
      const replyTo = headers.find((h) => h.name?.toLowerCase() === 'reply-to')?.value || undefined;
      const listId = headers.find((h) => h.name?.toLowerCase() === 'list-id')?.value || undefined;
      const dateHeader = headers.find((h) => h.name?.toLowerCase() === 'date')?.value;
      const date = dateHeader || undefined;

      const fullBody = MimeParser.extractBody(fullMsg.data.payload);
      const snippet = fullBody || fullMsg.data.snippet || '';

      results.push({
        id: msg.id,
        from,
        to,
        replyTo,
        listId,
        subject,
        date,
        bodySnippet: snippet.substring(0, 20000),
      });
    }

    return results;
    } catch (error: any) {
      if (error?.message?.includes('invalid_grant') || error?.response?.data?.error === 'invalid_grant') {
        Logger.error('Gmail', 'OAuth token expired or revoked (invalid_grant). Google Cloud apps in "Testing" mode expire tokens every 7 days. Switch to "In production" in Google Cloud Console and re-run "npm run auth".');
      }
      throw error;
    }
  }

  // Apply category label to message
  async applyCategoryLabel(messageId: string, categoryName: string): Promise<void> {
    if (!this.gmail) await this.authenticate();

    const labelsRes = await this.gmail!.users.labels.list({ userId: 'me' });
    let label = labelsRes.data.labels?.find((l) => l.name === categoryName);

    if (!label) {
      const newLabel = await this.gmail!.users.labels.create({
        userId: 'me',
        requestBody: {
          name: categoryName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
      });
      label = newLabel.data;
    }

    if (!label.id) throw new Error(`Label ID missing for category: ${categoryName}`);

    const addLabelIds = [label.id];
    const removeLabelIds: string[] = [];

    if (config.ARCHIVE_AFTER_TRIAGE) {
      removeLabelIds.push('INBOX');
    }

    await this.gmail!.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds,
        removeLabelIds,
      },
    });
  }

  // Delete all emails categorized under Misc
  async deleteMiscEmails(): Promise<number> {
    if (!this.gmail) await this.authenticate();

    const query = 'label:Misc -label:Trash';
    const messageRefs: gmail_v1.Schema$Message[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const res: any = await this.gmail!.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100,
        pageToken,
      });

      if (res.data.messages) {
        messageRefs.push(...res.data.messages);
      }
      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);

    if (messageRefs.length === 0) {
      Logger.info('Sweeper', 'No emails found in Misc category to delete.');
      return 0;
    }

    Logger.progress('Sweeper', `Deleting ${messageRefs.length} email(s) from Misc...`);
    let deletedCount = 0;

    for (const msg of messageRefs) {
      if (!msg.id) continue;
      try {
        await this.gmail!.users.messages.trash({
          userId: 'me',
          id: msg.id,
        });
        deletedCount++;
      } catch (err) {
        Logger.error('Sweeper', `Failed to trash Misc email ${msg.id}:`, err);
      }
    }

    return deletedCount;
  }
}
