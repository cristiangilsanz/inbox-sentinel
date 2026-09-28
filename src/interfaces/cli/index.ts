import { fileURLToPath } from 'url';
import path from 'path';
import { TriageOrchestrator } from '../../application/triage-orchestrator.js';
import { Logger } from '../../infrastructure/logger.js';

// Run standalone command line triage workflow
export async function runCli(): Promise<void> {
  Logger.start('CLI', 'Starting Triager in CLI daemon mode...');
  const orchestrator = new TriageOrchestrator();

  try {
    await orchestrator.runStandalone();
  } catch (error) {
    Logger.error('CLI', 'Failed to run triage:', error);
    process.exit(1);
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  runCli();
}
