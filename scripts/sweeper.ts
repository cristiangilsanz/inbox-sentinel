import { TriageOrchestrator } from '../src/application/triage-orchestrator.js';
import { Logger } from '../src/infrastructure/logger.js';

// Run Sweeper to purge Misc emails
async function main() {
  Logger.start('Sweeper', 'Starting Sweeper...');
  const orchestrator = new TriageOrchestrator();

  try {
    const result = await orchestrator.runSweeper();
    Logger.success('Sweeper', `Sweeper completed: ${result.deleted} message(s) removed.`);
  } catch (error) {
    Logger.error('Sweeper', 'Failed during Sweeper execution:', error);
    process.exit(1);
  }
}

main().catch((err) => {
  Logger.error('Sweeper', 'Unhandled Sweeper error:', err);
  process.exit(1);
});
