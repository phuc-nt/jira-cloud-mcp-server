# Jira Cloud MCP Server v3.0.0 - Production Release

🎉 **Production Ready: Complete Jira-only MCP Server with 56 tools and full backward compatibility!**

Available on npm (`@phuc-nt/jira-cloud-mcp-server`) or GitHub. Works with Claude Desktop, Cline, Cursor, and any MCP-compatible client.

---

## What's New in v3.0.0

### 🚀 Production Ready Release
- **56 Total Tools**: 48 core tools + 8 backward compatibility facades
- **100% Test Success**: All tools validated with comprehensive production testing
- **Zero Breaking Changes**: Complete backward compatibility with v2.x integrations
- **Enhanced Performance**: Sub-500ms response times for critical operations

### 🛡️ Backward Compatibility Layer
- **Seamless Migration**: All deprecated tools work via intelligent facade layer
- **Gentle Deprecation**: Clear warnings guide users to enhanced alternatives
- **Legacy Support**: `createStory`, `createSubtask`, `getEpic`, `updateEpic`, `searchEpics`, `searchStories`, `getEpicIssues`, `createBulkSubtasks`
- **No Code Changes**: Existing integrations continue working unchanged

### ⚡ Enhanced Universal Tools
- **createIssue**: Auto-type detection (Epic/Story/Sub-task) with smart field mapping
- **searchIssues**: Intelligent JQL building with type-aware filtering
- **getIssue**: Context-aware expansion with Epic→Stories→Sub-tasks hierarchy
- **updateIssue**: Type-specific handling with dual API strategy and fallbacks

### 🔧 Technical Excellence
- **Clean Architecture**: Tools-only design, removed complexity
- **Performance Optimized**: 75% reduction in tool complexity while increasing functionality  
- **Error Handling**: Comprehensive recovery with graceful degradation
- **TypeScript**: Full type safety and IntelliSense support

---

## Project Evolution

**Jira Cloud MCP Server** is the focused evolution of MCP Atlassian Server:

- **Original**: Jira + Confluence with Resources + Tools
- **v3.0**: Jira-only with Tools-only architecture
- **Benefits**: Simplified, faster, more reliable, easier to maintain

## Tool Categories

### Enhanced Universal (4 tools)
Core operations with intelligent handling for all issue types

### Core Operations (44 tools)
- **Issues**: List, transition, assign, comment management
- **Projects**: Project info, components, versions
- **Agile**: Boards, sprints, backlog management
- **Users**: Search, assignable users, project members
- **Filters & Dashboards**: CRUD operations with gadgets

### Backward Compatibility (8 tools)
Legacy tools work seamlessly with deprecation guidance

---

## Quick Start

### Claude Desktop (Recommended)
```bash
npx -y @smithery/cli install @phuc-nt/jira-cloud-mcp-server --client claude
```

### Manual Installation
```bash
npm install -g @phuc-nt/jira-cloud-mcp-server
```

### Configuration
Add to your MCP client config:
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

### Get Started
1. Get API token: https://id.atlassian.com/manage-profile/security/api-tokens
2. Configure your AI assistant
3. Start using natural language with Jira!

**Examples:**
- "List all issues assigned to me"
- "Create a new Epic called 'User Authentication'"
- "Search for open bugs in the current sprint"
- "Move issue ABC-123 to In Progress"

---

## Migration from v2.x

**Seamless Upgrade**: No code changes required! All v2.x tools continue working.

### Enhanced Alternatives
- `createStory` → Use `createIssue` with `issueType: "Story"`
- `getEpic` → Use `getIssue` with `includeHierarchy: true`
- `searchEpics` → Use `searchIssues` with `issueType: "Epic"`

### Benefits of Enhanced Tools
- **Intelligent**: Auto-detects issue types from context
- **Unified**: Single tools handle multiple scenarios
- **Faster**: Optimized performance with smart caching
- **Robust**: Better error handling and fallback strategies

---

## Documentation & Support

- **[Installation Guide](./llms-install.md)** - Complete setup for AI assistants
- **[API Reference](./docs/START_POINT.md)** - All 56 tools documented
- **[Migration Guide](./docs/02_implementation/sprints/sprint_5_3_completion_report.md)** - v2.x to v3.0 upgrade details
- **[GitHub Issues](https://github.com/phuc-nt/jira-cloud-mcp-server/issues)** - Support and feature requests

## What's Changed Since v2.x

### Architecture
✅ Removed: Confluence support, resources system
✅ Enhanced: Tools-only architecture, performance optimization
✅ Added: Backward compatibility layer, enhanced universal tools

### Performance
✅ 75% reduction in complexity
✅ Sub-500ms average response times
✅ 100% test success rate maintained

### Developer Experience  
✅ Simplified integration patterns
✅ Better error messages and recovery
✅ Clear migration paths with deprecation warnings

---

**Repository**: https://github.com/phuc-nt/jira-cloud-mcp-server  
**Original Project**: https://github.com/phuc-nt/mcp-atlassian-server  

**Status**: ✅ Production Ready | 🧪 56/56 Tools Working | 🛡️ Backward Compatible

Feedback and contributions welcome! 🚀