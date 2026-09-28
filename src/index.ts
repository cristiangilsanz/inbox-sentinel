import { fileURLToPath } from 'url';
import path from 'path';
import { runCli } from './interfaces/cli/index.js';

export * from './domain/types.js';
export * from './domain/categories.js';
export * from './application/triage-orchestrator.js';
export * from './interfaces/mcp/tool-definitions.js';

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  runCli();
}
