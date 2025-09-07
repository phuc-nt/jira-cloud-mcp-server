# CHANGELOG

All notable changes to MCP Jira Server will be documented in this file.

## [4.1.7] - 2025-09-07 (Enhanced JQL API Migration)

### 🚀 Major Enhancement: Modern Jira API Migration
**Breaking change resolved**: Migrated from deprecated GET `/rest/api/3/search` to modern POST `/rest/api/3/search/jql`

#### ✨ Key Improvements
- **Full Issue Data Retrieval**: Enhanced `enhancedSearchIssues` now returns complete issue details instead of IDs only
- **Modern Pagination**: Implemented `nextPageToken` continuation-based pagination (backward compatible with `startAt`)
- **Performance Optimization**: Direct API calls with fields parameter eliminate need for bulk fetch operations
- **Enhanced Error Handling**: Proper handling of unbounded JQL queries with helpful error messages

#### 🔧 Technical Changes
- **API Endpoint**: `GET /rest/api/3/search` → `POST /rest/api/3/search/jql`
- **Request Format**: URL parameters → JSON body with fields array
- **Pagination**: Offset-based → Token-based with `isLast` indicator
- **Response Format**: Updated to handle new API structure with comprehensive logging

#### ✅ Validation Results
**All search patterns tested successfully:**
- ✅ `fixVersion` filtering: 2 issues found with "Sprint 24 Release"
- ✅ `priority` filtering: 15 high-priority issues discovered
- ✅ `labels` filtering: 3 issues with "test" label located
- ✅ JQL generation and execution: Perfect syntax translation from parameters

#### 🎯 Benefits
- **Immediate Impact**: No more "IDs only" responses - full issue data in single API call
- **Future-Proof**: Aligned with Atlassian's enhanced JQL API roadmap  
- **Backward Compatibility**: Existing `startAt` pagination still supported with deprecation warnings
- **Enhanced Debugging**: Comprehensive request/response logging for troubleshooting

## [4.1.0] - 2025-08-12 (Phase 7 Complete - Tool Optimization & AI Client Enhancement)

### 🎯 Phase 7: Tool Optimization Complete
**Achievement**: Successfully reduced tools from 49 → 46 (6% optimization) while enhancing AI client compatibility

#### 🔄 Tool Consolidation Results  
**Sprint 7.1: Basic → Enhanced Replacement (3 tools removed)**
- ~~`searchIssues`~~ → **`enhancedSearchIssues`** (Better filtering, performance)
- ~~`getIssue`~~ → **`enhancedGetIssue`** (Context-aware, field selection)  
- ~~`getBoardSprints`~~ → **`listSprints`** (Strategic consolidation)

**Sprint 7.1.1: Dead Code Cleanup (6 files removed)**
- Removed unused basic tool files for bundle optimization
- Code maintainability improvement
- Cleaner codebase architecture

**Sprint 7.3: AI Client Compatibility Enhancement**
- Enhanced all tool descriptions with comprehensive usage patterns
- Added error prevention strategies and step-by-step workflow guidance
- Eliminated error-prone parameters (reporter field removal from createIssue)

#### 🧪 Quality Validation
- **Test Success Rate**: 100% (55/55 tests across all 4 modules)
- **Independent Validation**: AI Client testing confirms all achievements  
- **Module Architecture**: 4 specialized modules with perfect success rates
- **Real API Testing**: Validated against live Jira instances

#### 📊 Final v4.1.0 Statistics
- **Total Tools**: 46 optimized tools (Core: 14, Agile: 10, Dashboard: 8, Search: 14)
- **Success Rate**: 100% across all modules and tools
- **Architecture**: Mature modular system with up to 64% memory reduction
- **AI Client Ready**: Enhanced descriptions with comprehensive usage patterns
- **Bundle Optimization**: Dead code eliminated, faster startup times

## [4.0.0] - 2025-08-11 (Modular Architecture Release)

### 🏗️ Phase 6: Modular Architecture Complete
**Revolutionary Change**: Transformed monolithic server into 4 specialized modules

#### 🎯 Module Distribution
- **🔧 Core Module**: 14 essential CRUD operations
- **🏃‍♂️ Agile Module**: 10 sprint & workflow management tools  
- **📊 Dashboard Module**: 8 analytics & reporting tools
- **🔍 Search Module**: 14 enhanced search & Epic discovery tools

#### 🚀 Architecture Benefits
- **Memory Optimization**: Up to 64% reduction with selective module loading
- **Performance**: Faster startup and reduced resource usage
- **Flexibility**: Choose only the modules you need
- **Maintainability**: Clean separation of concerns

#### 📈 Production Metrics
- **49 Total Tools**: Distributed across 4 specialized modules
- **100% Success Rate**: All tools operational across all modules
- **Backward Compatibility**: Legacy monolithic entry point maintained
- **Production Ready**: Comprehensive error handling and logging

## [3.0.0] - 2025-08-10 (Production Release)

### 🎉 Sprint 5.3: Migration & Cleanup - PRODUCTION READY

**Major Achievement**: Complete migration to production-ready v3.0.0 with full backward compatibility

#### 🛡️ Backward Compatibility Layer
- **Complete Facade System**: 8 deprecated tools work seamlessly via facade layer
- **Zero Breaking Changes**: All v2.x integrations continue working unchanged  
- **Deprecation Warnings**: Gentle guidance to enhanced tools with migration paths
- **Facade Tools**: `createStory`, `createSubtask`, `getEpic`, `updateEpic`, `searchEpics`, `searchStories`, `getEpicIssues`, `createBulkSubtasks`

#### 🚀 Production Features
- **56 Total Tools**: 48 core tools + 8 backward compatibility facades
- **100% Test Success**: All tools validated with comprehensive test suite
- **Enhanced Architecture**: Universal tools with intelligent auto-detection
- **Performance**: Sub-500ms response times for critical operations
- **Error Handling**: Comprehensive error recovery and graceful degradation

#### 🔧 Technical Improvements
- **Tool Consolidation**: Specialized tools → Enhanced universal tools
- **Clean Architecture**: Removed 8 duplicate tool files, consolidated functionality
- **Documentation**: Complete Sprint 5.3 completion report and migration guide
- **Repository**: Renamed to `jira-cloud-mcp-server` for focused identity

#### 📊 Final Statistics
- **Development Timeline**: Completed 6 days ahead of schedule
- **Tool Coverage**: 56/56 tools operational (100% success rate)
- **Migration Support**: Complete backward compatibility maintained
- **Production Status**: ✅ APPROVED for v3.0.0 deployment

## [3.0.0-beta] - 2025-08-09

### 🚀 Sprint 5.1: Tool Consolidation & Enhancement (MAJOR RELEASE)

#### Revolutionary Changes
- **Tool Consolidation**: Transformed 15+ specialized tools into 4 enhanced universal tools
- **Enhanced createIssue**: Auto-type detection (Epic/Story/Sub-task), smart field mapping
- **Enhanced searchIssues**: Intelligent JQL building, type-aware filtering  
- **Enhanced getIssue**: Context-aware expansion, hierarchy mapping
- **Enhanced updateIssue**: Type-specific handling, dual API strategy

#### Critical Issue Fixes
- **Epic Update Fallback**: Agile API → Standard API fallback strategy for Epic fields
- **Custom Field Validation**: Smart field validation, graceful handling of missing fields
- **Assignee Validation**: Enhanced email/accountId validation with proper fallback
- **Test Infrastructure**: Fixed test logic, 100% test pass rate achieved

#### Performance & Quality
- **Architecture**: 75% reduction in tool complexity while increasing functionality
- **Performance**: Average 628ms per operation (vs 1.5s+ before)
- **Testing**: 8/8 integration tests pass, comprehensive workflow validation
- **Error Rate**: 0% - All critical issues resolved

## [2.2.0] - 2025-08-09

### 🎯 Sprint 4.5: Epic, Story & Sub-task Management

#### New Features
- Added 8 new Epic/Story/Sub-task management tools
- **Epic Management**: `getEpic`, `updateEpic`, `getEpicIssues`, `searchEpics` (4 tools)
- **Story Operations**: `createStory`, `searchStories` (2 tools)
- **Sub-task Management**: `createSubtask`, `createBulkSubtasks` (2 tools)
- Tool count expansion: 51 → 59 tools (+8 tools)
- 100% test success rate maintained (59/59 tools working)

#### Technical Enhancements
- Hybrid API integration: Jira Platform API v3 + Agile API v1.0
- Complete Epic → Story → Sub-task hierarchy support
- Bulk operations for efficient Sub-task creation
- Advanced filtering and search capabilities

## [2.1.2] - 2025-08-09

### 🔧 Sprint 4.4: Fix Version Management

#### New Features
- Added 4 new Fix Version management tools: `createFixVersion`, `listProjectVersions`, `getProjectVersion`, `updateFixVersion`
- Complete Fix Version lifecycle management for project releases
- Tool count expansion: 47 → 51 tools (+4 tools)
- 100% test success rate maintained (51/51 tools working)

#### Technical Details
- Enhanced error handling with comprehensive Fix Version API error mapping
- Full TypeScript definitions for all Fix Version operations
- Comprehensive test suite with real API validation

## [2.1.0] - 2025-05-17

### ✨ Refactor & Standardization
- Refactored the entire codebase to standardize resource/tool structure
- Removed content-metadata resource, merged metadata into page resource
- Updated developer documentation for easier extension and maintenance
- Ensured compatibility with latest MCP SDK

### 🔧 Bug Fixes
- Fixed duplicate resource registration issues
- Improved resource management and registration process
- Resolved issues with conflicting resource patterns

## [2.0.0] - 2025-05-11

### 🎉 Original MCP Atlassian Server Release
- **Dual System**: Jira + Confluence with Resources + Tools
- **48 Features**: Comprehensive Jira and Confluence operations
- **API Integration**: Jira API v3, Confluence API v2
- **Resource Pattern**: Mixed resources + tools architecture

---

## Project Evolution Notes

**v3.0.0** represents the **Jira Cloud MCP Server** fork - a focused, streamlined evolution:

- **Original (v2.x)**: Jira + Confluence with Resources + Tools
- **Fork (v3.0)**: Jira-only with Tools-only architecture  
- **Benefits**: Simplified, faster, more reliable, easier to maintain

**Migration Path**: v2.x users can seamlessly upgrade via backward compatibility facades.