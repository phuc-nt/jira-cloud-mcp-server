# CHANGELOG

## [2.1.2] - 2025-08-09

### 🔧 Sprint 4.4: Fix Version Management (Partial Implementation)
- **New Features**:
  - ✅ Added 4 new Fix Version management tools: `createFixVersion`, `listProjectVersions`, `getProjectVersion`, `updateFixVersion`
  - ✅ Complete Fix Version lifecycle management for project releases
  - ✅ Tool count expansion: 47 → 51 tools (+4 tools)
  - ✅ 100% test success rate maintained (51/51 tools working)

- **Adjustments**:
  - ⚠️ Temporarily disabled Fix Version assignment features in `updateIssue` tool due to project screen configuration requirements
  - ⚠️ Removed Fix Version filtering parameters from `searchIssues` tool (manual JQL still works)
  - 📋 Root cause: Fix Version field not available on issue edit screens for test projects

- **Technical Details**:
  - Enhanced error handling with comprehensive Fix Version API error mapping
  - Full TypeScript definitions for all Fix Version operations
  - Comprehensive test suite with real API validation
  - Architecture stability maintained - no breaking changes to existing functionality

## [2.1.1] - 2025-05-17

### 📝 Patch Release
- Documentation and metadata updates only. No code changes.

## [2.1.0] - 2025-05-17

### ✨ Refactor & Standardization
- Refactored the entire codebase to standardize resource/tool structure
- Completely removed the content-metadata resource, merged metadata into the page resource
- Updated and standardized developer documentation for easier extension and maintenance
- Ensured compatibility with the latest MCP SDK, improved security, scalability, and maintainability
- Updated `docs/introduction/resources-and-tools.md` to remove all references to content-metadata

### 🔧 Bug Fixes
- Fixed duplicate resource registration issues
- Improved resource management and registration process
- Resolved issues with conflicting resource patterns

## [2.0.0] - 2025-05-11

### ✨ Improvements
- Updated all APIs to latest versions (Jira API v3, Confluence API v2)
- Improved documentation and README structure
- Reorganized resources and tools into logical groups

### 🎉 New Features
- **Jira Board & Sprint:** Management of boards, sprints, and issues for Agile/Scrum workflows
- **Jira Dashboard & Gadgets:** Create/update dashboards, add/remove gadgets
- **Jira Filters:** Create, view, update, delete search filters for issues
- **Advanced Confluence Pages:** Version management, attachments, page deletion
- **Confluence Comments:** Update and delete comments
- Expanded from 21 to 48 features, including numerous new tools for both Jira and Confluence

### 🔧 Bug Fixes
- Fixed issues with Jira dashboard and gadget tools/resources
- Resolved problems with jira://users resource
- Improved error handling and messaging
- Fixed compatibility issues between API versions

### 🔄 Code Changes
- Restructured codebase for easier future expansion
- Improved feature implementation workflow 