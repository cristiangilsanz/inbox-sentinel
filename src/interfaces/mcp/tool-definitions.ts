export const mcpToolDefinitions = [
  {
    name: 'triage_emails_standalone',
    description: 'Runs the end-to-end background flow (fetches unclassified emails, classifies via configured LLM provider, applies Gmail labels, and notifies via Telegram).',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Optional maximum number of emails to process. If omitted, processes all unclassified emails in the inbox.'
        }
      }
    }
  },
  {
    name: 'fetch_emails_for_agent_triage',
    description: 'Returns raw clean metadata for unclassified emails in the inbox without calling external LLM APIs, enabling the agent to classify using its active context.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Optional maximum number of emails to fetch. If omitted, fetches all unclassified emails in the inbox.'
        }
      }
    }
  },
  {
    name: 'apply_agent_triage_actions',
    description: 'Applies labels decided by the agent in batch and dispatches the final Telegram summary.',
    parameters: {
      type: 'object',
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              emailId: { type: 'string' },
              category: { type: 'string' },
              summary: { type: 'string' },
              from: { type: 'string' }
            },
            required: ['emailId', 'category', 'summary']
          }
        }
      },
      required: ['actions']
    }
  }
];
