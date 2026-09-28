import { google } from 'googleapis';
import fs from 'fs/promises';
import http from 'http';
import { URL } from 'url';
import readline from 'readline';
import { config } from '../../config/env.js';
import { Logger } from '../../infrastructure/logger.js';

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

// Run interactive oauth authentication workflow
async function main() {
  Logger.start('Auth', 'Starting Gmail OAuth authorization...');

  let credsRaw: string;
  try {
    credsRaw = await fs.readFile(config.GMAIL_CREDENTIALS_PATH, 'utf-8');
  } catch {
    Logger.error('Auth', `Could not find credentials file at: ${config.GMAIL_CREDENTIALS_PATH}`);
    Logger.info('Auth', 'Please download OAuth client credentials from Google Cloud Console as credentials.json');
    process.exit(1);
  }

  const credentials = JSON.parse(credsRaw);
  const clientInfo = credentials.installed || credentials.web;

  if (!clientInfo) {
    Logger.error('Auth', 'Invalid credentials.json format. Expected "installed" or "web" application credentials.');
    process.exit(1);
  }

  const { client_id, client_secret } = clientInfo;
  const redirectUri = 'http://localhost:3000/oauth2callback';

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  Logger.info('Auth', `Open this URL in your browser to authorize Inbox Sentinel:\n${authUrl}`);

  const server = http.createServer(async (req, res) => {
    try {
      if (req.url && req.url.startsWith('/oauth2callback')) {
        const queryParams = new URL(req.url, 'http://localhost:3000').searchParams;
        const code = queryParams.get('code');

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authorization successful!</h1><p>You can close this tab and return to your terminal.</p>');

          server.close();
          await saveToken(oauth2Client, code);
          process.exit(0);
        }
      }
    } catch (err) {
      res.writeHead(500);
      res.end('Authentication failed');
      Logger.error('Auth', 'Error handling authorization callback:', err);
    }
  });

  server.listen(3000, () => {
    Logger.progress('Auth', 'Listening on http://localhost:3000/oauth2callback for callback...');
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Or paste the authorization code here if redirection does not work: ', async (code) => {
    rl.close();
    server.close();
    if (code.trim()) {
      await saveToken(oauth2Client, code.trim());
      process.exit(0);
    }
  });
}

// Exchange authorization code for token and save to disk
async function saveToken(client: any, code: string) {
  try {
    const { tokens } = await client.getToken(code);
    await fs.writeFile(config.GMAIL_TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
    Logger.success('Auth', `Token saved successfully to: ${config.GMAIL_TOKEN_PATH}`);
    Logger.info('Auth', 'Important: In Google Cloud Console, ensure OAuth Consent Screen Publishing Status is "In production" so tokens do not expire after 7 days.');
  } catch (error) {
    Logger.error('Auth', 'Failed to retrieve access token:', error);
  }
}

main().catch((err) => Logger.error('Auth', 'Unhandled authentication error:', err));
