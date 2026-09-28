import fs from 'fs/promises';
import { TriageOrchestrator } from '../src/application/triage-orchestrator.js';
import { TriageActionsArraySchema } from '../src/domain/types.js';
import { Logger } from '../src/infrastructure/logger.js';

// Read actions input from command arguments or standard input
async function readInput(): Promise<string> {
  const args = process.argv.slice(2);

  const fileIndex = args.indexOf('--file');
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    return await fs.readFile(args[fileIndex + 1], 'utf-8');
  }

  const dataIndex = args.indexOf('--data');
  if (dataIndex !== -1 && args[dataIndex + 1]) {
    return args[dataIndex + 1];
  }

  if (process.stdin.isTTY || args.length === 0) {
    Logger.error('Agent', 'No input provided.');
    Logger.info('Agent', 'Usage: npx tsx scripts/apply-actions.ts --file <path> | --data <json>');
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', (err) => reject(err));
  });
}

// Execute agent triage actions on gmail and telegram
async function main() {
  const rawInput = await readInput();
  if (!rawInput.trim()) {
    Logger.error('Agent', 'Empty actions payload provided.');
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawInput);
  } catch (err) {
    Logger.error('Agent', 'Invalid JSON input format provided.');
    process.exit(1);
  }

  const validation = TriageActionsArraySchema.safeParse(parsed);
  if (!validation.success) {
    Logger.error('Agent', 'Validation failed on triage actions schema:');
    console.error(validation.error.format());
    process.exit(1);
  }

  const actions = validation.data;
  if (actions.length === 0) {
    Logger.info('Agent', 'No actions found to apply.');
    process.exit(0);
  }

  Logger.start('Agent', `Applying ${actions.length} triage action(s) to Gmail & Telegram...`);
  const orchestrator = new TriageOrchestrator();
  const result = await orchestrator.applyAgentActions(actions);

  Logger.success('Agent', `Successfully applied actions: ${JSON.stringify(result)}`);
}

main().catch((err) => {
  Logger.error('Agent', 'Unexpected execution error:', err);
  process.exit(1);
});
