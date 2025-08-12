# MCP Jira Server

> **AI meets Jira** - Connect AI assistants to your Jira workspace with modular architecture and enhanced compatibility

<p align="center">
  <img src="assets/atlassian_logo_icon.png" alt="Jira Logo" width="120" />
</p>

[![Tools](https://img.shields.io/badge/Tools-46%20Optimized-blue)](#features)
[![Modules](https://img.shields.io/badge/Architecture-4%20Modules-orange)](#modular-architecture)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](#production-status)

## 🚀 What is this?

**MCP Jira Server** enables AI assistants like **Claude**, **Cline**, **Cursor**, and other MCP-compatible tools to interact with Atlassian Jira using **API token authentication** - featuring **modular architecture**, enhanced AI client compatibility, and enterprise-ready performance. Choose only the modules you need for optimized memory usage.

## ✨ Features

### 🔧 **46 Optimized Tools Across 4 Modules:**

- **Core Module** (14): Essential CRUD operations, user management, project operations
- **Agile Module** (10): Sprint & board management, workflow operations  
- **Dashboard Module** (8): Analytics, reporting, dashboard management
- **Search Module** (14): Enhanced search & Epic discovery, universal user search

### 🎯 **Key Capabilities:**

- ✅ **Modular Architecture** - Up to 64% memory reduction with selective loading
- ✅ **Enhanced AI Client Compatibility** - Comprehensive usage patterns & error prevention
- ✅ **Production Ready** - 100% test success rate across all 46 tools

## 🚀 Quick Start

### 📦 Install from NPM (Recommended)

```bash
npm install -g jira-cloud-mcp-server
```

**📖 [Complete Installation Guide](INSTALL.md)** - Follow the step-by-step setup guide

## Architecture

### Module Distribution (46 Total Tools - Optimized)

| Module | Tools | Success Rate | Use Case |
|--------|-------|--------------|-----------|
| **Core** | 14 | 100% | Essential CRUD operations |
| **Agile** | 10 | 100% | Sprint & workflow management |
| **Dashboard** | 8 | 100% | Analytics & reporting |
| **Search** | 14 | 100% | Enhanced search & Epic discovery |

### Deployment Flexibility

**Essential Stack** (Core + Search = 28 tools)
```json
{
  "mcpServers": {
    "jira-core": {"command": "npx", "args": ["jira-cloud-mcp-server/dist/modules/core"]},
    "jira-search": {"command": "npx", "args": ["jira-cloud-mcp-server/dist/modules/search"]}
  }
}
```

**Complete Agile Team** (Core + Agile + Search = 38 tools)
```json
{
  "mcpServers": {
    "jira-core": {"command": "npx", "args": ["jira-cloud-mcp-server/dist/modules/core"]},
    "jira-agile": {"command": "npx", "args": ["jira-cloud-mcp-server/dist/modules/agile"]},
    "jira-search": {"command": "npx", "args": ["jira-cloud-mcp-server/dist/modules/search"]}
  }
}
```

**Analytics Focus** (Search + Dashboard = 22 tools)
```json
{
  "mcpServers": {
    "jira-search": {"command": "npx", "args": ["jira-cloud-mcp-server/dist/modules/search"]},
    "jira-dashboard": {"command": "npx", "args": ["jira-cloud-mcp-server/dist/modules/dashboard"]}
  }
}
```

**Legacy Compatibility** (All 46 tools)
```json
{
  "mcpServers": {
    "jira": {"command": "npx", "args": ["jira-cloud-mcp-server"]}
  }
}
```

## 💡 Usage Examples

**Create Issues with Natural Language:**

```
Human: Create a new Epic called "User Authentication System" in the DEMO project

AI Assistant: I'll create that Epic for you using the createIssue tool:
□ Project: DEMO
□ Issue Type: Epic (auto-detected)
□ Summary: "User Authentication System"
□ Creating issue now...

✅ Created Epic DEMO-142: "User Authentication System"
```

**Advanced Search & Analysis:**

```
Human: Find all high-priority bugs assigned to me that were created last week

AI Assistant: I'll search for your high-priority bugs from last week:
□ Use enhancedSearchIssues with JQL: "assignee = currentUser() AND priority = High AND issueType = Bug AND created >= -7d"
□ Found 3 matching issues
□ Analyzing priority, status, and resolution timeframes...

Found 3 high-priority bugs: DEMO-140, DEMO-138, DEMO-135 - details attached.
```

**Sprint Management & Agile Workflows:**

```
Human: Show me the current sprint status and add issue DEMO-123 to the active sprint

AI Assistant: I'll check your sprint status and add the issue:
□ Use listSprints to find active sprint for your board
□ Use getSprintIssues to see current sprint contents  
□ Use addIssueToSprint to add DEMO-123
□ Provide sprint summary with updated issue count

Current Sprint "Sprint 24" has 12 issues, adding DEMO-123 now... ✅ Added successfully!
```

## 🛠️ Tech Stack

- **TypeScript** - Type-safe development with strict mode
- **Node.js** - Runtime environment (16.x+)
- **MCP Protocol** - Model Context Protocol for AI integration
- **Jira APIs** - Native Jira Platform API v3 + Agile API v1.0
- **Modular Architecture** - Specialized modules for optimized performance

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**🎉 Connect your AI assistant to Jira with modular architecture and enhanced compatibility!**