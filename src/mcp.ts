import { runMcpServer } from './interfaces/mcp/server.js';
import { Logger } from './infrastructure/logger.js';

runMcpServer().catch((error) => {
  Logger.error('MCP', 'Fatal error starting MCP server:', error);
  process.exit(1);
});
