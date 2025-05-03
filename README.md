# MCP Server for Atlassian (Jira & Confluence)

[![MCP Server](https://img.shields.io/badge/MCP%20Marketplace-Ready-brightgreen)](https://github.com/phuc-nt/mcp-atlassian-server)

## Introduction

**MCP Atlassian Server** is a Model Context Protocol (MCP) server that connects AI agents like Cline, Claude Desktop, or Cursor to Atlassian Jira and Confluence, enabling them to query data and perform actions through a standardized interface.

> **Note:** This server is primarily designed and optimized for use with Cline, though it follows the MCP standard and can work with other MCP-compatible clients.

- **Key Features:**  
  - Connect AI agents to Atlassian Jira and Confluence
  - Support both Resources (read-only) and Tools (actions/mutations)
  - Easy integration with Cline through MCP Marketplace
  - Local-first design for personal development environments
  - Optimized integration with Cline AI assistant

## Quick Installation Guide

> **Recommended:** Read [llms-install.md](./llms-install.md) for detailed instructions, prerequisites, configuration steps, and usage examples for both macOS and Windows.

## System Requirements

- Node.js 16+ and npm
- Git
- Atlassian Cloud account and API token with appropriate permissions
- Cline AI assistant (primary supported client)
- (Optional) Docker Desktop for container-based deployment

## Quick Setup

```bash
git clone https://github.com/phuc-nt/mcp-atlassian-server.git
cd mcp-atlassian-server
npm install
npm run build
```

Configure Cline connection (add to `cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "mcp-atlassian-server": {
      "disabled": false,
      "timeout": 60,
      "command": "node",
      "args": [
        "/full/path/to/mcp-atlassian-server/dist/index.js"
      ],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      },
      "transportType": "stdio"
    }
  }
}
```

> **For step-by-step details, see [llms-install.md](./llms-install.md)**

## Key Capabilities

### Jira Capabilities
- **Query Data**: View issues, projects, users, and search with JQL
- **Perform Actions**: Create issues, update content, transition states, assign issues

### Confluence Capabilities
- **Content Management**: Create pages with simple HTML content
- **Collaboration**: Add comments to Confluence pages

### Example Use Cases
- "Create a new issue in project DEMO about login errors"
- "Find all issues assigned to me in the current sprint"
- "Transition issue DEMO-43 to Done status"
- "Create a Confluence page titled 'Meeting Notes'"

> These queries work best within the Cline environment, which has been thoroughly tested with this MCP server.

## Detailed Documentation & Notes

- See [llms-install.md](./llms-install.md) for detailed setup instructions for Git, Node.js, Docker, and Cline configuration.
- Ensure your Atlassian API token has sufficient permissions.  
  - See "API Token Permissions Note" in [llms-install.md](./llms-install.md).
- Be aware of security implications when using LLMs with configuration files containing tokens.
- If you encounter permission errors, verify the permissions of the user who created the token.

## Troubleshooting

If you experience connection issues:

1. Verify Docker container is running (if using Docker):
   ```bash
   docker ps --filter "name=mcp-atlassian"
   ```
2. Check container logs:
   ```bash
   docker logs mcp-atlassian
   ```
3. Test Atlassian API connection:
   ```bash
   curl -u "your-email@example.com:your-api-token" -H "Content-Type: application/json" https://your-site.atlassian.net/rest/api/3/project
   ```

## Contribute & Support

- Contribute by opening Pull Requests or Issues on GitHub.
- Join the MCP/Cline community for additional support.

---

**MCP Atlassian Server** is ready for one-click installation from Cline Marketplace!  
**See detailed instructions in [llms-install.md](./llms-install.md)**

> While the server uses the open MCP standard, it is primarily designed and tested for Cline users.