import fs from 'fs/promises';
import { TriageOrchestrator } from '../src/application/triage-orchestrator.js';
import { Logger } from '../src/infrastructure/logger.js';

// Fetch unclassified emails from gmail inbox
async function main() {
  const args = process.argv.slice(2);
  let limit: number | undefined = undefined;
  let outputPath: string | undefined = undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      const parsed = parseInt(args[i + 1], 10);
      if (!isNaN(parsed) && parsed > 0) limit = parsed;
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    }
  }

  if (!outputPath) {
    Logger.setUseStderr(true);
  }

  const orchestrator = new TriageOrchestrator();
  Logger.progress('Fetch', `Fetching unclassified emails${limit ? ` (limit: ${limit})` : ' (all pending)'}...`);
  const emails = await orchestrator.fetchForAgent(limit);

  Logger.success('Fetch', `Retrieved ${emails.length} unclassified email(s).`);

  if (outputPath) {
    await fs.writeFile(outputPath, JSON.stringify(emails, null, 2), 'utf-8');
    Logger.info('Fetch', `Saved to ${outputPath}`);
  } else {
    process.stdout.write(JSON.stringify(emails, null, 2) + '\n');
  }
}

main().catch((err) => {
  Logger.error('Fetch', 'Failed to fetch emails:', err);
  process.exit(1);
});
