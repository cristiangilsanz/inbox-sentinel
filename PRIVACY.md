# Privacy Policy for Inbox Sentinel

*Last updated: October 2026*

Inbox Sentinel is an open-source, self-hosted personal tool designed to organize and categorize incoming emails in Gmail using AI and send execution summaries via Telegram.

## Data Processing & Security
- **Self-Hosted Execution**: All email fetching, parsing, classification, and labeling run locally on your own machine or inside your own private GitHub Actions runners.
- **Gmail Access**: Inbox Sentinel requests read and modify access exclusively to inspect incoming message subjects and bodies, apply categorization labels, and archive or purge designated emails.
- **Third-Party Data Sharing**: Email metadata is strictly forwarded to your explicitly configured AI provider (e.g., Google Gemini, Anthropic, OpenAI, or a local Ollama instance) solely for classification. No personal data, email contents, or credentials are sold, shared with third parties, or collected by the project maintainers.
- **Credentials & Tokens**: All OAuth credentials and tokens remain entirely under your control in your local environment and your private GitHub repository secrets.

For questions, open an issue on the GitHub repository: https://github.com/cristiangilsanz/inbox-sentinel
