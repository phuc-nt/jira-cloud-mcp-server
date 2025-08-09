# CHANGELOG

## [3.0.0-beta] - 2025-08-09

### 🚀 Sprint 5.1: Tool Consolidation & Enhancement (MAJOR RELEASE)
- **Revolutionary Changes**:
  - ✅ **Tool Consolidation**: Transformed 15+ specialized tools into 4 enhanced universal tools
  - ✅ **Enhanced createIssue**: Auto-type detection (Epic/Story/Sub-task), smart field mapping
  - ✅ **Enhanced searchIssues**: Intelligent JQL building, type-aware filtering  
  - ✅ **Enhanced getIssue**: Context-aware expansion, hierarchy mapping
  - ✅ **Enhanced updateIssue**: Type-specific handling, dual API strategy

- **Critical Issue Fixes**:
  - ✅ **Epic Update Fallback**: Agile API → Standard API fallback strategy for Epic fields
  - ✅ **Custom Field Validation**: Smart field validation, graceful handling of missing fields
  - ✅ **Assignee Validation**: Enhanced email/accountId validation with proper fallback
  - ✅ **Test Infrastructure**: Fixed test logic, 100% test pass rate achieved

- **Performance & Quality**:
  - ✅ **Architecture**: 75% reduction in tool complexity while increasing functionality
  - ✅ **Performance**: Average 628ms per operation (vs 1.5s+ before)
  - ✅ **Testing**: 8/8 integration tests pass, comprehensive workflow validation
  - ✅ **Error Rate**: 0% - All critical issues resolved

- **Migration Ready**:
  - Backward compatibility maintained during transition
  - AI-friendly descriptions with clear usage patterns
  - Production-ready enhanced tools architecture

## [2.2.0] - 2025-08-09

### 🎯 Sprint 4.5: Epic, Story & Sub-task Management (Complete Implementation)
- **New Features**:
  - ✅ Added 8 new Epic/Story/Sub-task management tools
  - ✅ **Epic Management**: `getEpic`, `updateEpic`, `getEpicIssues`, `searchEpics` (4 tools)
  - ✅ **Story Operations**: `createStory`, `searchStories` (2 tools)
  - ✅ **Sub-task Management**: `createSubtask`, `createBulkSubtasks` (2 tools)
  - ✅ Tool count expansion: 51 → 59 tools (+8 tools)
  - ✅ 100% test success rate maintained (59/59 tools working)

- **Technical Enhancements**:
  - Hybrid API integration: Jira Platform API v3 + Agile API v1.0
  - Complete Epic → Story → Sub-task hierarchy support
  - Bulk operations for efficient Sub-task creation
  - Advanced filtering and search capabilities
  - Epic color and progress management
  - Story points and Sprint associations

- **Architecture**:
  - Enhanced comprehensive test suite with 5 functional groups
  - Full AI Client validation with real project testing (XDEMO2)
  - TypeScript compilation and error handling improvements
  - Tools-only architecture maintained with no breaking changes

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