# Sprint 2.1: Resource→Tool Conversion Foundation

> **Phase 2 - Tools-Only Transformation | Sprint 2.1**  
> **Duration**: January 13-16, 2025 (4 working days)  
> **Focus**: Convert essential Jira resources to tools - Issues, Projects, Users, Basic Filters

---

## 🎯 Sprint Objectives

**Primary Goal**: Convert 7 high-priority Jira resources to tools, establishing the foundation for Phase 2's tools-only architecture.

**Success Criteria**:
- [ ] 7 new read-operation tools implemented and tested
- [ ] Total tool count: 25 tools (18 existing + 7 new)
- [ ] All tools follow consistent naming pattern: `listIssues`, `getProject`, `searchUsers`
- [ ] Integration tests passing with 100% success rate
- [ ] Response time <500ms for all new tools

---

## 📋 Detailed Task Breakdown

### **Day 1 (Jan 13): Issues & Projects Foundation**

#### **🎫 Issues Resources → Tools (4 tools)**

1. **listIssues** (Convert from resource)
   - **Implementation**: `src/tools/jira/list-issues.ts`
   - **Function**: List issues with filtering (assignee, project, status)
   - **API**: `GET /rest/api/3/search` with JQL
   - **Parameters**: `projectKey?`, `assigneeId?`, `status?`, `limit?`
   - **Response**: Formatted issue list with key fields
   - **Estimated Time**: 2 hours

2. **getIssue** (Convert from resource)
   - **Implementation**: `src/tools/jira/get-issue.ts`
   - **Function**: Get detailed issue information
   - **API**: `GET /rest/api/3/issue/{issueIdOrKey}`
   - **Parameters**: `issueKey` (required)
   - **Response**: Complete issue details with custom fields
   - **Estimated Time**: 1.5 hours

3. **searchIssues** (New enhanced tool)
   - **Implementation**: `src/tools/jira/search-issues.ts`
   - **Function**: Advanced issue search with JQL
   - **API**: `GET /rest/api/3/search` with custom JQL
   - **Parameters**: `jql` (required), `maxResults?`, `startAt?`
   - **Response**: Search results with pagination
   - **Estimated Time**: 2 hours

#### **📁 Projects Resources → Tools (2 tools)**

4. **listProjects** (Convert from resource)
   - **Implementation**: `src/tools/jira/list-projects.ts`
   - **Function**: List all accessible projects
   - **API**: `GET /rest/api/3/project`
   - **Parameters**: `expand?`, `recent?`, `includeArchived?`
   - **Response**: Project list with basic info
   - **Estimated Time**: 1.5 hours

5. **getProject** (Convert from resource)
   - **Implementation**: `src/tools/jira/get-project.ts`
   - **Function**: Get detailed project information
   - **API**: `GET /rest/api/3/project/{projectIdOrKey}`
   - **Parameters**: `projectKey` (required), `expand?`
   - **Response**: Complete project details
   - **Estimated Time**: 1.5 hours

**Day 1 Total**: 5 tools | 8.5 hours estimated

---

### **Day 2 (Jan 14): Users & Advanced Issues**

#### **👥 Users Resources → Tools (3 tools)**

6. **getUser** (Convert from resource)
   - **Implementation**: `src/tools/jira/get-user.ts`
   - **Function**: Get user profile and permissions
   - **API**: `GET /rest/api/3/user` with accountId
   - **Parameters**: `accountId` (required)
   - **Response**: User profile with project permissions
   - **Estimated Time**: 1.5 hours

7. **searchUsers** (Convert from resource)
   - **Implementation**: `src/tools/jira/search-users.ts`
   - **Function**: Search users for assignment
   - **API**: `GET /rest/api/3/user/search`
   - **Parameters**: `query`, `projectKey?`, `issueKey?`
   - **Response**: User list for assignment
   - **Estimated Time**: 2 hours

8. **getCurrentUser** (New tool)
   - **Implementation**: `src/tools/jira/get-current-user.ts`
   - **Function**: Get current authenticated user info
   - **API**: `GET /rest/api/3/myself`
   - **Parameters**: None
   - **Response**: Current user profile and permissions
   - **Estimated Time**: 1 hour

**Day 2 Total**: 3 tools | 4.5 hours estimated

---

### **Day 3 (Jan 15): Integration & Testing**

#### **🔧 Tool Registration & Integration**

9. **Update Tool Registration**
   - **File**: `src/tools/index.ts`
   - **Task**: Add all 7 new tools to registerAllTools()
   - **Validation**: Ensure proper import and registration
   - **Estimated Time**: 1 hour

10. **Integration Testing Setup**
    - **Test Framework**: Update `test-client/src/tool-test.ts`
    - **Coverage**: Test all 25 tools (18 existing + 7 new)
    - **Validation**: Response format, error handling, performance
    - **Estimated Time**: 3 hours

11. **Performance Validation**
    - **Target**: <500ms average response time
    - **Method**: Individual tool testing with timing
    - **Documentation**: Performance benchmarks
    - **Estimated Time**: 2 hours

**Day 3 Total**: System integration | 6 hours estimated

---

### **Day 4 (Jan 16): Refinement & Documentation**

#### **📝 Standardization & Documentation**

12. **Response Format Standardization**
    - **Pattern**: `{ content: [{ type: 'text', text: string }], isError?: boolean }`
    - **Task**: Ensure all 7 new tools follow consistent format
    - **Validation**: Error handling and success responses
    - **Estimated Time**: 2 hours

13. **Parameter Validation**
    - **Framework**: Zod schemas for all new tools
    - **Location**: `src/schemas/jira.ts` updates
    - **Coverage**: Required/optional parameters, types
    - **Estimated Time**: 2 hours

14. **Sprint Documentation**
    - **Update**: Sprint 2.1 completion report
    - **Metrics**: Tool count, performance, test results
    - **Planning**: Sprint 2.2 preparation
    - **Estimated Time**: 1.5 hours

**Day 4 Total**: Finalization | 5.5 hours estimated

---

## 🎯 Sprint 2.1 Success Metrics

### **Tool Count Targets**
- **Starting**: 18 tools ✅ (validated in Phase 1)
- **Adding**: 7 new read-operation tools
- **Target**: 25 total tools
- **Achievement**: 100% basic read coverage for Jira

### **Tool Categories Coverage**
- **Issues**: ✅ listIssues, getIssue, searchIssues + existing 4 tools = 7 tools
- **Projects**: ✅ listProjects, getProject + existing 0 tools = 2 tools  
- **Users**: ✅ getUser, searchUsers, getCurrentUser = 3 tools
- **Existing Tools**: ✅ 18 tools (create/update operations)

### **Performance Targets**
- **Response Time**: <500ms average (measured during integration testing)
- **Success Rate**: 100% for integration tests
- **Error Handling**: Proper MCP error format for all failures

### **Quality Gates**
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Integration tests passing (`cd test-client && npm test`)
- [ ] All tools properly registered and discoverable
- [ ] Consistent response format across all tools
- [ ] Parameter validation with Zod schemas

---

## 🚀 Sprint 2.1 Deliverables

### **New Tool Files**
1. `src/tools/jira/list-issues.ts` - Issue listing with filters
2. `src/tools/jira/get-issue.ts` - Individual issue retrieval  
3. `src/tools/jira/search-issues.ts` - Advanced JQL search
4. `src/tools/jira/list-projects.ts` - Project listing
5. `src/tools/jira/get-project.ts` - Project details
6. `src/tools/jira/get-user.ts` - User profile retrieval
7. `src/tools/jira/search-users.ts` - User search for assignment
8. `src/tools/jira/get-current-user.ts` - Current user info

### **Updated Core Files**
- `src/tools/index.ts` - Tool registration updates
- `src/schemas/jira.ts` - New Zod schemas
- `test-client/src/tool-test.ts` - Updated integration tests

### **Documentation**
- Sprint 2.1 completion report
- Updated tool inventory (25 total)
- Performance benchmarking results
- Sprint 2.2 planning document

---

## 🔄 Sprint Transition

### **Sprint 2.1 → Sprint 2.2 Handoff**

**Completion Criteria for Sprint 2.2 Start**:
- [ ] All 7 new tools implemented and tested
- [ ] 25 total tools validated in integration test
- [ ] Performance benchmarks meeting targets
- [ ] Sprint 2.2 document created with remaining scope

**Sprint 2.2 Preview**: 
- Boards & Sprints read operations (5-6 tools)
- Dashboard & Filter read operations (2-3 tools) 
- Advanced operations completion
- Complete tool standardization

---

**Sprint 2.1 Status**: 📋 **READY TO START**  
**Expected Completion**: January 16, 2025  
**Next Sprint**: Sprint 2.2 - Advanced Resource Conversion

_Last updated: January 10, 2025_