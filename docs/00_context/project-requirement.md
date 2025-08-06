# MCP Jira Server - Project Requirements Document

> **Project**: Simplified MCP Jira Server (Tools-Only Architecture)  
> **Version**: 3.0.0 Refactor  
> **Objective**: Transform existing dual-system (Jira+Confluence) with resources+tools to a simplified Jira-only tools-only MCP server  
> **Timeline**: Phased refactoring approach with backward compatibility consideration

---

## 🎯 Project Vision

**Mission Statement**: Đơn giản hóa MCP Atlassian Server thành một MCP server chuyên biệt chỉ cho Jira với kiến trúc tools-only, loại bỏ complexity của dual-system và resources layer.

**Core Philosophy**: "Tools-Only, Jira-Focused" - Mỗi interaction với Jira là một action có thể thực thi, bao gồm cả read operations.

---

## 🔧 Technical Requirements

### 1. Architecture Transformation

**From (Current v2.1.1)**:
- Dual system: Jira + Confluence
- Dual pattern: Resources (read) + Tools (actions)
- URI-based resources: `jira://issues/{key}`, `confluence://spaces/{id}`
- 48+ features across 2 systems

**To (Target v3.0.0)**:
- Single system: Jira only
- Single pattern: Tools only (including read operations)
- Tool-based interactions: `listIssues`, `getIssue`, `createIssue`, `updateIssue`
- ~25 core Jira tools, focused and simplified

### 2. Tools-Only Design Principles

**All Operations as Tools**:
- Read operations: `listIssues`, `getProject`, `getUser` → Tools returning data
- Write operations: `createIssue`, `updateIssue`, `transitionIssue` → Tools performing actions
- Search operations: `searchIssues`, `searchProjects` → Tools with query parameters

**Tool Response Format**:
```typescript
interface ToolResponse {
  content: Array<{
    type: 'text' | 'json';
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}
```

### 3. Jira Feature Scope

**Essential Tools (25 tools)**:

**Issue Management (8 tools)**:
- `listIssues` - List issues with filtering
- `getIssue` - Get issue details
- `searchIssues` - Search issues with JQL
- `createIssue` - Create new issue
- `updateIssue` - Update existing issue
- `transitionIssue` - Change issue status
- `assignIssue` - Assign issue to user
- `deleteIssue` - Delete issue

**Project Management (4 tools)**:
- `listProjects` - List all projects
- `getProject` - Get project details
- `getProjectRoles` - Get project roles
- `getProjectUsers` - Get users in project

**Board & Sprint Management (7 tools)**:
- `listBoards` - List Agile boards
- `getBoard` - Get board details
- `getBoardSprints` - Get sprints in board
- `getSprint` - Get sprint details
- `createSprint` - Create new sprint
- `startSprint` - Start sprint
- `closeSprint` - Close sprint

**Filter & Search (3 tools)**:
- `listFilters` - List user filters
- `getFilter` - Get filter details
- `createFilter` - Create search filter

**User Management (3 tools)**:
- `getUser` - Get user details
- `searchUsers` - Search users
- `getCurrentUser` - Get current authenticated user

### 4. Removed Features

**Confluence System**: Hoàn toàn loại bỏ
- All confluence resources and tools
- Space, page, comment management
- Confluence-specific utilities and APIs

**Resources Pattern**: Hoàn toàn loại bỏ
- URI-based resource access
- ResourceTemplate pattern
- Resource registration system
- Resource metadata formatting

**Complex Features**: Đơn giản hóa hoặc loại bỏ
- Dashboard & gadget management → Loại bỏ
- Advanced sprint operations → Giữ lại cơ bản
- Complex filter operations → Đơn giản hóa

---

## 📁 Target Architecture

### File Structure Simplification

**From (Current)**:
```
src/
├── resources/
│   ├── jira/ (7 resource types)
│   └── confluence/ (2 resource types)
├── tools/
│   ├── jira/ (15+ tools)
│   └── confluence/ (8 tools)
├── utils/ (12 utility files)
└── schemas/ (3 schema files)
```

**To (Target)**:
```
src/
├── tools/
│   └── jira/ (25 tools organized by domain)
├── utils/
│   ├── jira-api.ts (simplified API client)
│   ├── mcp-helpers.ts (tool helpers only)
│   └── logger.ts
├── schemas/
│   └── jira.ts (consolidated Jira schemas)
└── index.ts
```

### Domain Organization

**Tools by Domain**:
```
tools/
├── issues/ (8 issue tools)
├── projects/ (4 project tools)
├── boards/ (7 board/sprint tools)
├── filters/ (3 filter tools)
└── users/ (3 user tools)
```

---

## 🚀 Migration Strategy

### Phase 1: Foundation Restructure
- Remove all Confluence-related code
- Remove resources registration system
- Simplify MCP server initialization
- Update main index.ts for tools-only

### Phase 2: Tool Transformation
- Convert existing Jira resources to tools
- Implement new read-operation tools
- Standardize tool response formats
- Update error handling for tools-only

### Phase 3: Code Cleanup
- Remove unused utilities
- Consolidate schemas
- Update documentation
- Clean up tests

### Phase 4: Testing & Validation
- Comprehensive tool testing
- Integration testing with live Jira API
- Performance benchmarking
- Documentation update

---

## ⚖️ Backward Compatibility

**Breaking Changes (Acceptable)**:
- Resources no longer available → Must migrate to equivalent tools
- Confluence functionality removed → Complete removal
- URI patterns changed → Tool-based interactions

**Migration Path for Users**:
- Provide mapping document: Resource URI → Tool call
- Update examples and documentation
- Version bump to 3.0.0 to signal breaking changes

**Example Migrations**:
```typescript
// Old (v2.1.1)
Resource: jira://issues?assignee=currentUser()
URI: jira://issues/DEMO-123

// New (v3.0.0)
Tool: listIssues({ assignee: "currentUser" })
Tool: getIssue({ issueKey: "DEMO-123" })
```

---

## 📊 Success Criteria

### Technical Metrics
- [ ] Code reduction: >40% codebase size reduction
- [ ] Tool count: Exactly 25 Jira tools operational
- [ ] Response time: <500ms average tool execution
- [ ] Test coverage: >90% tool test coverage
- [ ] Zero Confluence remnants in codebase

### Quality Metrics
- [ ] All tools follow consistent pattern
- [ ] Error handling standardized across tools
- [ ] Documentation complete for all 25 tools
- [ ] Integration tests passing with live Jira API

### User Experience
- [ ] Clear migration guide from v2.x to v3.0
- [ ] Tool discovery easy through MCP clients
- [ ] Consistent tool response formats
- [ ] Intuitive tool naming and parameters

---

**Reference Implementation**: Current v2.1.1 codebase at `/Users/phucnt/Workspace/mcp-atlassian-server`  
**Target Delivery**: v3.0.0 with tools-only, Jira-focused architecture

---

_Document Status: Initial Draft_  
_Last Updated: 2025-01-06_  
_Next Review: After Phase 1 completion_