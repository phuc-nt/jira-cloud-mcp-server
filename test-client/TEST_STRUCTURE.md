# Test Client Structure

**Organized and Streamlined Test Suite for MCP Atlassian Server**

## 📁 Current Structure

### Core Files:
- **`main-test-runner.ts`** - Main test runner with organized menu system
- **`sprint-5-1-integration.ts`** - Complete Sprint 5.1 enhanced tools integration testing
- **`config-manager.ts`** - Test configuration and data management

### Specialized Tests:
- **`test-jira-issues.ts`** - Basic issue operations testing
- **`test-jira-projects.ts`** - Project-related functionality testing  
- **`test-jira-users.ts`** - User management testing
- **`list-mcp-inventory.ts`** - Tool inventory and capability listing

### Archive:
- **`archive/`** - Old test files for reference (enhanced-*, group-*, comprehensive-*)

## 🚀 Quick Start

### Run Main Test Suite:
```bash
cd test-client
npm run build
node dist/main-test-runner.js
```

### Test Options:
1. **Sprint 5.1 Integration Tests** - Enhanced tools workflow testing
2. **Basic Tool Validation** - Core functionality verification
3. **Performance Benchmark** - Response time measurements
4. **Quick Smoke Tests** - Fast connectivity and basic function check
5. **List Available Tools** - Tool inventory display

### Direct Sprint 5.1 Testing:
```bash
node dist/sprint-5-1-integration.js
```

## 📊 Test Coverage

### Enhanced Tools (Sprint 5.1):
- ✅ **createIssue** - Auto-detection and intelligent field mapping
- ✅ **searchIssues** - Smart filtering and type-aware queries
- ✅ **getIssue** - Context-aware expansion and hierarchy support
- ✅ **updateIssue** - Type-specific field handling and dual API strategy

### Integration Scenarios:
- ✅ **Complete Workflow** - Create → Search → Get → Update
- ✅ **Performance Testing** - Response time benchmarks
- ✅ **Error Handling** - Graceful failure scenarios
- ✅ **Auto-Detection** - Type inference validation

## 🛠️ Configuration

Test configuration managed via:
- **`test-data-config.json`** - Test data and environment settings
- **`.env`** - Jira credentials and connection details
- **`config-manager.ts`** - Programmatic configuration access

## 📈 Sprint 5.1 Progress

**Tool Consolidation**: 75% complete
- Days 1-2: ✅ Enhanced createIssue
- Days 3-4: ✅ Enhanced searchIssues  
- Day 5: ✅ Enhanced getIssue
- Day 6: ✅ Enhanced updateIssue
- Day 7: 🔄 Integration Testing (Current)

**Quality Metrics**:
- Test Coverage: Comprehensive
- Performance: Optimized (< 2s per operation)
- Error Handling: Robust
- User Experience: Enhanced with smart auto-detection

---

*Test suite streamlined and organized for Sprint 5.1 completion*
