# Jira Cloud MCP Server

<p align="center">
  <img src="assets/atlassian_logo_icon.png" alt="Jira Logo" width="120" />
</p>

[![MCP Server](https://img.shields.io/badge/MCP%20Server-Jira%20Cloud-blue)](https://github.com/phuc-nt/jira-cloud-mcp-server)
[![Tools Only](https://img.shields.io/badge/Architecture-Tools%20Only-green)](https://modelcontextprotocol.io)

## Overview

**Jira Cloud MCP Server** connects AI agents (Claude Desktop, Cline, Cursor) to Atlassian Jira Cloud through the Model Context Protocol (MCP). This is a **Jira-only, tools-only** fork of the original [MCP Atlassian Server](https://github.com/phuc-nt/mcp-atlassian-server), streamlined for focused Jira operations.

### Key Features
- **56 Jira tools** for complete workflow management
- **Backward compatibility** - all deprecated tools work via facades  
- **Enhanced universal tools** with intelligent auto-detection
- **100% test success rate** with real Jira API validation
- **Production ready** with comprehensive error handling

## Architecture

**Tools-Only Design**: Pure MCP tools interface, no resources
- 4 Enhanced Universal Tools (createIssue, searchIssues, getIssue, updateIssue)
- 44 Specialized Tools (projects, users, boards, sprints, filters, etc.)
- 8 Backward Compatibility Facades for deprecated tools

## Quick Start

### Installation via Smithery (Claude Desktop)

```bash
npx -y @smithery/cli install @phuc-nt/jira-cloud-mcp-server --client claude
```

### Manual Installation

1. **Install the server**:
```bash
npm install -g @phuc-nt/jira-cloud-mcp-server
```

2. **Configure your MCP client** with your Jira credentials:
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

3. **Get your API token** from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)

## Example Tools Usage

```typescript
// Create different issue types automatically
await createIssue({
  projectKey: "PROJ",
  summary: "New Epic",
  issueType: "Epic"  // Auto-detected from context
});

// Smart search with JQL building
await searchIssues({
  projectKey: "PROJ", 
  issueType: "Story",
  status: "In Progress"
});

// Get issue with full hierarchy
await getIssue({
  issueKey: "PROJ-123",
  includeHierarchy: true  // Epic → Stories → Sub-tasks
});
```

## Tool Categories

### Enhanced Universal (4 tools)
- `createIssue` - Universal creation with auto-type detection
- `searchIssues` - Intelligent JQL building and filtering  
- `getIssue` - Context-aware expansion with hierarchy
- `updateIssue` - Type-specific handling with fallbacks

### Core Operations (44 tools)
- **Issues**: List, transition, assign, comment management
- **Projects**: Project info, components, versions
- **Agile**: Boards, sprints, backlog management
- **Users**: Search, assignable users, project members
- **Filters & Dashboards**: CRUD operations with gadgets

### Backward Compatibility (8 tools)  
- Legacy tools (`createStory`, `getEpic`, etc.) work via facades
- Deprecation warnings guide migration to enhanced tools

## Project Evolution

This server is the **Jira-focused evolution** of the original dual-system MCP Atlassian Server:

- **Original**: Jira + Confluence with Resources + Tools
- **This Fork**: Jira-only with Tools-only architecture
- **Benefits**: Simplified, faster, more reliable, easier to maintain

## Documentation

- **[Installation Guide](./llms-install.md)** - Detailed setup for AI assistants
- **[API Reference](./docs/START_POINT.md)** - Complete tool documentation  
- **[Migration Guide](./docs/02_implementation/sprints/sprint_5_3_completion_report.md)** - Backward compatibility details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Security

- API tokens inherit user permissions
- Store tokens securely in environment variables
- Never commit tokens to version control
- Review token permissions regularly

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Status**: ✅ Production Ready (v3.0.0) | 🧪 56/56 Tools Passing | 🚀 Zero Breaking Changes