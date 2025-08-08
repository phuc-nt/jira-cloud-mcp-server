# MCP Jira Server v3.0.0 - Test Client

Comprehensive test suite for MCP Jira Server v3.0.0 with 45 tools across 4 functional groups.

## 🚀 Quick Start

1. **Build test client:**
   ```bash
   npm run build
   ```

2. **Environment setup:**
   Create `.env` file in project root with:
   ```env
   ATLASSIAN_BASE_URL=https://your-instance.atlassian.net
   ATLASSIAN_EMAIL=your-email@company.com
   ATLASSIAN_API_TOKEN=your-api-token
   ```

3. **Run tests:**
   ```bash
   # All tests (comprehensive)
   npm run test:comprehensive
   
   # Individual groups
   npm run test:issues      # Issues Management (11 tools)
   npm run test:projects    # Projects & Users (7 tools) 
   npm run test:boards      # Boards & Sprints (11 tools)
   npm run test:filters     # Filters & Dashboards (16 tools)
   
   # Legacy basic test
   npm run test
   ```

## 📋 Test Groups Overview

### 🎯 Issues Management (11 tools)
- **Read Operations:** listIssues, getIssue, searchIssues, getIssueTransitions, getIssueComments
- **Write Operations:** createIssue, updateIssue, transitionIssue, assignIssue, addIssueComment, updateIssueComment
- **Test Data:** Creates real test issue for comprehensive testing

### 📁👥 Projects & Users (7 tools)  
- **Projects:** listProjects, getProject
- **Users:** searchUsers, listUsers, getUser, getAssignableUsers (2 contexts)
- **Integration:** Project-user relationship analysis

### 🏆🏃 Boards & Sprints (11 tools)
- **Boards:** listBoards, getBoard, getBoardConfiguration, getBoardIssues, getBoardSprints  
- **Sprints:** listSprints, getSprint, getSprintIssues
- **Management:** createSprint, addIssueToSprint, addIssuesToBacklog, rankBacklogIssues

### 🔍📊 Filters & Dashboards (16 tools)
- **Filters:** listFilters, getMyFilters, getFilter, createFilter, updateFilter, deleteFilter
- **Dashboards:** listDashboards, getDashboard, getDashboardGadgets, createDashboard, updateDashboard
- **Gadgets:** getJiraGadgets, addGadgetToDashboard, removeGadgetFromDashboard
- **Cleanup:** Automatically cleans up test data

## 🧪 Test Features

### Real Data Testing
- Uses actual Jira project: `XDEMO2` (configurable)
- Creates and manages real test data
- Comprehensive validation of all tool operations

### Error Handling
- Graceful error handling with detailed logging
- Continues testing even if individual tools fail
- Clear success/failure reporting

### Logging & Analysis
- Detailed operation logging
- Statistics and metrics reporting
- Integration relationship analysis
- Performance insights

### Test Safety
- Automatic cleanup of created test data
- Non-destructive testing approach
- Clear identification of test-created content

## 🔧 Configuration

### Project Settings
```typescript
const CONFIG = {
  PROJECT_KEY: "XDEMO2",  // Your test project
  SERVER_PATH: "/path/to/mcp-atlassian-server/dist/index.js"
};
```

### Test Customization
- **Max Results:** Configurable limits for list operations
- **Test Data:** Timestamped test items for identification
- **Verbosity:** Detailed vs summary logging options

## 📊 Expected Results

### Phase 3 Complete - 100% v2.x Coverage
- **Total Tools:** 45/45 (100% coverage achieved)
- **Success Rate:** Expected >95% success rate
- **Performance:** <500ms average response time
- **Architecture:** Tools-only pattern validation

### Tool Distribution
```
Issues Management:     11 tools (24%)
Boards & Sprints:      11 tools (24%) 
Filters & Dashboards:  16 tools (36%)
Projects & Users:       7 tools (16%)
```

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Errors:**
   - Check `.env` configuration
   - Verify API token permissions
   - Ensure server is running

2. **Test Data Issues:**
   - Verify project key exists: `XDEMO2`
   - Check user permissions for project
   - Ensure boards/sprints are available

3. **TypeScript Errors:**
   ```bash
   npm run build  # Check compilation
   ```

### Debug Mode
```bash
# Verbose logging
VERBOSE=true npm run test:comprehensive
```

## 📈 Performance Monitoring

The test suite includes performance monitoring:
- Response time tracking
- Success/failure rates
- Resource utilization analysis
- API call optimization insights

## 🎯 Integration with MCP Server

This test client validates the complete MCP Jira Server v3.0.0 architecture:
- Tools-only pattern compliance
- No resources capability (expected)
- Direct tool registration validation
- Error handling consistency
- API response format standards

## 📝 Test Reporting

Each test group provides:
- ✅ Success indicators
- ❌ Failure details with error messages  
- 📊 Statistics and metrics
- 📋 Created test data references
- 🧹 Cleanup confirmation

Perfect for validating the complete 45-tool ecosystem with real Jira data!