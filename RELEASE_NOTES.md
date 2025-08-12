# MCP Jira Server v4.1.0 - Tool Optimization & AI Client Enhancement

🎯 **Optimized & AI-Ready: Refined MCP Server with 46 optimized tools across 4 specialized modules!**

Available on npm (`jira-cloud-mcp-server`) or GitHub. Works with Claude Desktop, Cline, Cursor, and any MCP-compatible client.

---

## What's New in v4.1.0 

### 🎯 Phase 7: Tool Optimization Complete
- **46 Optimized Tools**: 6% reduction from 49 → 46 tools with enhanced functionality
- **100% Test Success**: 55/55 tests pass across all 4 modules
- **AI Client Enhanced**: Comprehensive usage patterns and error prevention strategies
- **Dead Code Eliminated**: Cleaner codebase with faster startup times

### 🏗️ Modular Architecture (v4.0+)
- **🔧 Core Module**: 14 essential CRUD operations
- **🏃‍♂️ Agile Module**: 10 sprint & workflow management tools  
- **📊 Dashboard Module**: 8 analytics & reporting tools
- **🔍 Search Module**: 14 enhanced search & Epic discovery tools

### ⚡ Memory & Performance Benefits
- **Up to 64% Memory Reduction**: With selective module loading
- **Flexible Deployment**: Choose only the modules you need
- **Clean Architecture**: Independent entry points and optimized resource usage

### 🔄 Tool Optimization Highlights
**Sprint 7.1: Enhanced Replacements**
- ~~`searchIssues`~~ → **`enhancedSearchIssues`** (Better filtering, performance)
- ~~`getIssue`~~ → **`enhancedGetIssue`** (Context-aware, field selection)  
- ~~`getBoardSprints`~~ → **`listSprints`** (Strategic consolidation)

**Sprint 7.3: AI Client Compatibility**
- Enhanced all tool descriptions with comprehensive usage patterns
- Added error prevention strategies and step-by-step workflow guidance
- Eliminated error-prone parameters for better AI integration

### 🧪 Quality Validation
- **Independent Testing**: AI Client validation confirms all achievements
- **Real API Testing**: Validated against live Jira instances
- **Module Architecture**: 4 specialized modules with perfect success rates

---

## Architecture Evolution

**MCP Jira Server** evolution through major versions:

- **v2.x**: Monolithic Jira + Confluence with Resources + Tools
- **v3.x**: Jira-only with Tools-only architecture and backward compatibility
- **v4.0**: Modular architecture with 4 specialized modules
- **v4.1**: Tool optimization with enhanced AI client compatibility

## Module Overview

### 🔧 Core Module (14 tools)
Essential CRUD operations for issue and data management
- **Auto-Approve Safe**: getAssignableUsers, getIssueTransitions
- **Smart Operations**: Enhanced createIssue, updateIssue with validation

### 🏃‍♂️ Agile Module (10 tools)  
Sprint and board management for agile workflows
- **Key Tools**: createSprint, startSprint, closeSprint, addIssueToSprint
- **Board Management**: listBoards, getBoard with configuration

### 📊 Dashboard Module (8 tools)
Analytics, reporting, and dashboard management
- **Safe Operations**: All read operations auto-approve eligible  
- **Management**: createDashboard, getDashboardGadgets, getJiraGadgets

### 🔍 Search Module (14 tools)
Enhanced search and data retrieval - completely safe for auto-approval
- **Enhanced Tools**: enhancedSearchIssues, enhancedGetIssue
- **Universal Search**: universalSearchUsers replacing 3 legacy tools
- **Epic Discovery**: epicSearchAgile via Agile API

---

## Quick Start

### NPM Installation
```bash
npm install -g jira-cloud-mcp-server
```

### Modular Configuration (Recommended)
Choose the modules you need for optimized memory usage:

**Essential Stack** (Core + Search = 28 tools):
```json
{
  "mcpServers": {
    "jira-core": {
      "command": "npx",
      "args": ["jira-cloud-mcp-server/dist/modules/core"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    },
    "jira-search": {
      "command": "npx",
      "args": ["jira-cloud-mcp-server/dist/modules/search"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com", 
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Legacy Monolithic (All 46 tools):
```json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["jira-cloud-mcp-server"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
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

**Repository**: https://github.com/phuc-nt/mcp-atlassian-server  

**Status**: ✅ Production Ready | 🧪 46/46 Tools Working | 🏗️ Modular Architecture | 🤖 AI Client Enhanced

Feedback and contributions welcome! 🚀