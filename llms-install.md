# Jira Cloud MCP Server v3.0.0 Installation Guide for AI

> **Important Note:** Jira Cloud MCP Server is optimized for AI assistants like Claude Desktop, Cline, and Cursor. This is a **Jira-only, tools-only** fork of the original MCP Atlassian Server, focused on streamlined Jira operations.

> **Version Note:** This guide is for Jira Cloud MCP Server v3.0.0 with 56 tools including backward compatibility facades. Achieves 100% test success rate with production-ready performance.

## System Requirements
- macOS 10.15+ or Windows 10+ 
- Node.js 18+ (for running the MCP server)
- Atlassian Cloud account with Jira access
- Jira API token (instructions below)
- AI assistant (Claude Desktop, Cline, Cursor)

## Installation Options

You have two ways to install Jira Cloud MCP Server:

1. **[Install via Smithery](#option-1-install-via-smithery)** (easiest for Claude Desktop)
2. **[Manual installation](#option-2-manual-installation)** (npm or from source)

## Option 1: Install via Smithery

For Claude Desktop users, use Smithery for automatic installation:

```bash
npx -y @smithery/cli install @phuc-nt/jira-cloud-mcp-server --client claude
```

This automatically configures Claude Desktop with the MCP server. Skip to [Get API Token section](#get-atlassian-api-token).

## Option 2: Manual Installation  

### Install from npm (Recommended)

```bash
# Global installation
npm install -g @phuc-nt/jira-cloud-mcp-server

# Or install in your project
npm install @phuc-nt/jira-cloud-mcp-server
```

### Install from Source

```bash
git clone git@github.com:phuc-nt/jira-cloud-mcp-server.git
cd jira-cloud-mcp-server
npm install
npm run build
```

## Configure Your AI Assistant

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jira-cloud": {
      "command": "jira-cloud-mcp-server",
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@company.com", 
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Cline Configuration

Add to your `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "jira-cloud": {
      "command": "node",
      "args": ["/path/to/jira-cloud-mcp-server/dist/index.js"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@company.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Cursor Configuration

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "jira-cloud": {
      "command": "jira-cloud-mcp-server",
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site.atlassian.net", 
        "ATLASSIAN_USER_EMAIL": "your-email@company.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Get Atlassian API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token", name it (e.g., "Jira Cloud MCP")
3. Copy the token immediately (it will not be shown again)

### API Token Permissions

- **Inherits user permissions**: Token has same access as the account that created it
- **Required permissions**: Browse Projects, Create/Edit/Transition Issues, Manage Sprints
- **Best practice**: Use dedicated service account for team environments
- **Security**: Never share tokens, revoke if compromised

## Tool Categories (56 Total)

### Enhanced Universal Tools (4)
- `createIssue` - Universal creation with auto-type detection
- `searchIssues` - Intelligent JQL building and filtering  
- `getIssue` - Context-aware expansion with hierarchy
- `updateIssue` - Type-specific handling with fallbacks

### Core Operations (44)
- **Issues**: List, transition, assign, comments
- **Projects**: Info, components, versions
- **Agile**: Boards, sprints, backlog management  
- **Users**: Search, assignable users
- **Filters & Dashboards**: CRUD operations

### Backward Compatibility (8)
- Legacy tools work via facades with deprecation warnings
- Seamless migration from specialized tools

## Usage Examples

```bash
# Ask your AI assistant:
"List all issues assigned to me in project ABC"
"Create a new Epic called 'User Authentication'"
"Move issue ABC-123 to In Progress status"
"Search for all open bugs in the current sprint"
"Create a sub-task under ABC-123 for code review"
```

## Security Guidelines

### Safe Practices
- Store tokens in environment variables only
- Use dedicated API tokens (not personal passwords)
- Don't commit tokens to version control
- Regularly rotate API tokens

### AI Safety Warning
- **Risk**: Asking AI to read config files sends tokens to cloud providers
- **Safe**: Tokens stay local unless you ask AI to examine config
- **Best practice**: Never ask AI to read/analyze credential files

## Troubleshooting

### Common Issues

1. **"Permission denied"**: Check API token permissions
2. **"Site not found"**: Verify ATLASSIAN_SITE_NAME format
3. **"Tool not found"**: Restart AI assistant after configuration
4. **Slow responses**: Check network connectivity to Atlassian

### Test Installation

```bash
# Test MCP server directly
node /path/to/jira-cloud-mcp-server/dist/index.js

# Should show: "MCP server started with 56 tools"
```

### Get Help

- **GitHub Issues**: https://github.com/phuc-nt/jira-cloud-mcp-server/issues
- **Documentation**: [Project Documentation](./docs/START_POINT.md)
- **Original Project**: [MCP Atlassian Server](https://github.com/phuc-nt/mcp-atlassian-server)

## Project Background

**Jira Cloud MCP Server** is a focused fork of the original MCP Atlassian Server:

- **Original**: Jira + Confluence with Resources + Tools
- **This Fork**: Jira-only with Tools-only architecture  
- **Benefits**: Simplified, faster, more reliable, easier to maintain

---

**Status**: ✅ Production Ready (v3.0.0) | 🧪 56/56 Tools Working | 🛡️ Backward Compatible