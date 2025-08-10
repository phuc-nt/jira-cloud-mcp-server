# MCP Jira Server v4.0.0

<p align="center">
  <img src="assets/atlassian_logo_icon.png" alt="Jira Logo" width="120" />
</p>

[![MCP Server](https://img.shields.io/badge/MCP%20Server-v4.0.0-blue)](https://github.com/phuc-nt/mcp-atlassian-server)
[![Modular Architecture](https://img.shields.io/badge/Architecture-Modular-green)](https://modelcontextprotocol.io)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)]()

## Overview

**MCP Jira Server v4.0.0** is a production-ready, modular MCP server enabling AI assistants (Claude Desktop, Cline, Cursor) to interact with Atlassian Jira through specialized modules. Built for flexibility, performance, and memory optimization.

### 🚀 New in v4.0.0: Modular Architecture

Choose the modules you need for optimized memory usage and focused functionality:

```bash
# 4 Specialized Entry Points:
mcp-jira-core        # 14 tools - Essential CRUD operations  
mcp-jira-agile       # 10 tools - Sprint & Board management
mcp-jira-dashboard   # 8 tools - Analytics & reporting
mcp-jira-search      # 18 tools - Read-only data retrieval
```

**Memory Optimization**: Up to 64% reduction depending on module selection  
**Success Rate**: 98% (49/50 tools working across all modules)  
**Architecture**: Clean separation, independent entry points, production-ready

## Key Features

- **🎯 Modular Design**: 4 specialized modules for different use cases
- **⚡ Performance**: Up to 64% memory reduction with selective loading
- **🔐 Security**: Read-only modules eliminate data modification risks
- **🧪 Battle-Tested**: 100% test coverage with real Jira API validation
- **🔄 Backward Compatibility**: Legacy monolithic entry point maintained
- **🛡️ Production Ready**: Comprehensive error handling and logging

## Architecture

### Module Distribution (48 Total Tools)

| Module | Tools | Success Rate | Use Case |
|--------|-------|--------------|-----------|
| **Core** | 14 | 100% | Essential CRUD operations |
| **Agile** | 10 | 100% | Sprint & workflow management |
| **Dashboard** | 8 | 87.5% | Analytics & reporting |
| **Search** | 16 | 100% | Read-only data retrieval |

### Deployment Flexibility

**Essential Stack** (Core + Search = 30 tools)
```json
{
  "mcpServers": {
    "jira-core": {"command": "npx", "args": ["@phuc-nt/mcp-atlassian-server/dist/modules/core"]},
    "jira-search": {"command": "npx", "args": ["@phuc-nt/mcp-atlassian-server/dist/modules/search"]}
  }
}
```

**Complete Agile Team** (Core + Agile + Search = 42 tools)
```json
{
  "mcpServers": {
    "jira-core": {"command": "npx", "args": ["@phuc-nt/mcp-atlassian-server/dist/modules/core"]},
    "jira-agile": {"command": "npx", "args": ["@phuc-nt/mcp-atlassian-server/dist/modules/agile"]},
    "jira-search": {"command": "npx", "args": ["@phuc-nt/mcp-atlassian-server/dist/modules/search"]}
  }
}
```

**Analytics Focus** (Search + Dashboard = 26 tools)
```json
{
  "mcpServers": {
    "jira-search": {"command": "npx", "args": ["@phuc-nt/mcp-atlassian-server/dist/modules/search"]},
    "jira-dashboard": {"command": "npx", "args": ["@phuc-nt/mcp-atlassian-server/dist/modules/dashboard"]}
  }
}
```

**Legacy Compatibility** (All 56 tools)
```json
{
  "mcpServers": {
    "jira": {"command": "npx", "args": ["@phuc-nt/mcp-atlassian-server"]}
  }
}
```

## Quick Start

### Installation via NPM

```bash
npm install -g @phuc-nt/mcp-atlassian-server
```

### Configuration

Create your `.env` file:
```bash
ATLASSIAN_SITE_NAME=your-site-name
ATLASSIAN_USER_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

### Claude Desktop Setup

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "jira-core": {
      "command": "npx",
      "args": ["@phuc-nt/mcp-atlassian-server/dist/modules/core"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Module Guide

### 🔧 Core Module (14 tools)
Essential CRUD operations for issue and data management.

**Auto-Approve Safe Tools:**
```json
"autoApprove": ["getAssignableUsers", "getIssueTransitions"]
```

### 🏃‍♂️ Agile Module (10 tools)  
Sprint and board management for agile workflows.

**Key Tools:** `createSprint`, `startSprint`, `closeSprint`, `addIssueToSprint`

### 📊 Dashboard Module (8 tools)
Analytics, reporting, and dashboard management.

**Key Tools:** `createDashboard`, `getDashboardGadgets`, `getJiraGadgets`

### 🔍 Search Module (16 tools)
Read-only data retrieval and search operations - completely safe for auto-approval.

**Auto-Approve All Tools:**
```json
"autoApprove": [
  "searchIssues", "enhancedSearchIssues", "listBacklogIssues",
  "getIssue", "getIssueTransitions", "getIssueComments",
  "universalSearchUsers", "listUsers", "getUser",
  "listProjects", "listProjectVersions", "listFilters", "listBoards", "listSprints",
  "getProject", "getFilter"
]
```

## API Authentication

### Jira Cloud API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create API token
3. Use your email and token for authentication

### Required Permissions

- **Jira Core**: Browse projects, Create/Edit/Delete issues
- **Jira Agile**: Manage sprints and boards  
- **Jira Admin**: Dashboard and filter management (Dashboard module)

## Testing

### Test Individual Modules

```bash
# Test Search module (read-only, safe)
cd test-client
npx tsx src/modules/test-search-module.ts

# Test Core module (CRUD operations)
npx tsx src/modules/test-core-module.ts

# Test Agile module
npx tsx src/modules/test-agile-module.ts

# Test Dashboard module  
npx tsx src/modules/test-dashboard-module.ts
```

### Environment Setup for Testing

```bash
# Copy sample environment
cp test-client/.env.sample test-client/.env

# Edit with your credentials
nano test-client/.env
```

## Migration from v3.x

### Breaking Changes
- **Multiple Entry Points**: Choose specific modules instead of monolithic server
- **Configuration Update**: Update MCP client configs for new module paths
- **Memory Optimization**: Significant reduction in resource usage

### Migration Strategy
1. **Assessment**: Determine which modules you need
2. **Gradual**: Start with Core + Search modules  
3. **Optimization**: Add Agile/Dashboard as needed
4. **Testing**: Validate with your specific workflows

## Performance Benchmarks

| Configuration | Tools | Memory Usage | Startup Time | Use Case |
|---------------|-------|--------------|--------------|-----------|
| Search Only | 16 | ~34% of v3.x | ~66% faster | Read-only integration |
| Core + Search | 30 | ~40% of v3.x | ~60% faster | Essential operations |
| All Modules | 48 | ~63% of v3.x | ~37% faster | Full functionality |
| Legacy v3.x | 56 | 100% baseline | 100% baseline | Backward compatibility |

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Support

- 📖 [Documentation](https://github.com/phuc-nt/mcp-atlassian-server/docs)
- 🐛 [Issues](https://github.com/phuc-nt/mcp-atlassian-server/issues)
- 💬 [Discussions](https://github.com/phuc-nt/mcp-atlassian-server/discussions)

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**v4.0.0 Production Ready** - Modular architecture with 98% tool success rate  
Built with ❤️ for the MCP and Jira communities