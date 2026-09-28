import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TriageOrchestrator } from '../../application/triage-orchestrator.js';
import { mcpToolDefinitions } from './tool-definitions.js';
import { Logger } from '../../infrastructure/logger.js';

// Create model context protocol server instance
export function createMcpServer(): Server {
  const orchestrator = new TriageOrchestrator();

  const server = new Server(
    {
      name: 'inbox-sentinel',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: mcpToolDefinitions.map((def) => ({
        name: def.name,
        description: def.description,
        inputSchema: def.parameters,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name === 'triage_emails_standalone') {
        const result = await orchestrator.runStandalone(args?.limit as number | undefined);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      if (name === 'fetch_emails_for_agent_triage') {
        const result = await orchestrator.fetchForAgent(args?.limit as number | undefined);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      if (name === 'apply_agent_triage_actions') {
        const result = await orchestrator.applyAgentActions((args?.actions as any) || []);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  });

  return server;
}

// Start model context protocol stdio transport server
export async function runMcpServer(): Promise<void> {
  Logger.setUseStderr(true);
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  Logger.info('MCP', 'Inbox Sentinel MCP Server running on stdio');
}

if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  runMcpServer().catch((error) => {
    Logger.error('MCP', 'Fatal error in MCP server:', error);
    process.exit(1);
  });
}
