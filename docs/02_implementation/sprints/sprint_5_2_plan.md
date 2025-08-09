# Sprint 5.2 Plan: User & Board Consolidation
## Secondary Tool Consolidation - Week 2

### Sprint Overview
- **Sprint Number**: 5.2
- **Theme**: User Management & Board Operations Consolidation
- **Duration**: 7 days (August 19-25, 2025)
- **Team**: 1 developer
- **Priority**: HIGH - Complete secondary consolidations

---

## 🎯 Sprint Objectives

### Primary Goals
✅ **Universal `searchUsers` Tool**: Context-aware user search with mode switching  
✅ **Enhanced `getBoardIssues` Tool**: Unified board issue retrieval with scope filtering  
✅ **Integration Testing**: End-to-end workflow validation  
✅ **Performance Optimization**: Ensure consolidated tools perform well  

### Success Criteria
- User tools: 3 → 1 consolidated tool
- Board tools: 2 → 1 enhanced tool  
- Integration workflows fully tested
- Performance within acceptable thresholds

---

## 📋 Day-by-Day Breakdown

### **Day 1-3: Universal `searchUsers` Tool**

#### **Day 1: Analysis & Design**
```typescript
MORNING (4h):
- Analyze current user tools (searchUsers, listUsers, getAssignableUsers)
- Design unified parameter schema with mode switching
- Plan context-aware permission checking
- Define backward compatibility strategy

AFTERNOON (4h):
- Implement core searchUsers enhancement
- Add mode parameter (all, assignable, project-members)
- Implement basic user search functionality
- Create initial Zod schema
```

#### **Day 2: Advanced Features Implementation**
```typescript
MORNING (4h):
- Implement assignable user context (project/issue specific)
- Add project member filtering
- Implement pagination with consistent patterns
- Add permission validation logic

AFTERNOON (4h):
- Context-aware user filtering
- Performance optimization for large user bases
- Smart caching for repeated queries
- Error handling for permission issues
```

#### **Day 3: Testing & Integration**
```typescript
MORNING (4h):
- Comprehensive test suite for all modes
- Permission boundary testing
- Performance testing vs specialized tools
- Integration with issue assignment workflows

AFTERNOON (4h):
- Edge case handling (invalid projects, permissions)
- Large dataset performance validation
- Memory usage optimization
- Documentation updates
```

**Deliverables Day 1-3:**
- Universal searchUsers tool with mode switching
- Context-aware permission handling
- Performance optimization
- Comprehensive test coverage

### **Day 4-5: Enhanced `getBoardIssues` Tool**

#### **Day 4: Board Issues Consolidation**
```typescript
MORNING (4h):
- Analyze getBoardIssues + listBacklogIssues consolidation
- Design scope parameter (all, backlog, active-sprints, done-sprints)
- Implement unified board issue retrieval
- Add flexible filtering options

AFTERNOON (4h):
- Scope-based issue filtering
- Integration with enhanced searchIssues patterns
- Consistent response formatting
- Performance optimization
```

#### **Day 5: Advanced Features & Testing**
```typescript
MORNING (4h):
- Advanced filtering (sprint state, issue types)
- JQL integration for board context
- Pagination consistency
- Error handling improvements

AFTERNOON (4h):
- Comprehensive testing all scopes
- Integration with board workflows
- Performance benchmarking
- Documentation completion
```

**Deliverables Day 4-5:**
- Enhanced getBoardIssues with scope filtering
- Unified board issue patterns
- Performance validation
- Complete test coverage

### **Day 6-7: Integration Testing & Optimization**

#### **Day 6: End-to-End Workflow Testing**
```typescript
MORNING (4h):
- Complete Epic→Story→Sub-task workflows
- User assignment workflows with new searchUsers
- Board management with enhanced getBoardIssues
- Cross-tool integration validation

AFTERNOON (4h):
- Performance regression testing
- Memory usage analysis across all tools
- Concurrent usage testing
- Error propagation validation
```

#### **Day 7: Optimization & Documentation**
```typescript
MORNING (4h):
- Performance tuning based on test results
- Memory optimization
- Response time improvements
- Caching strategy refinements

AFTERNOON (4h):
- Complete documentation updates
- AI-friendly usage patterns
- Performance benchmarks documentation
- Sprint completion validation
```

**Deliverables Day 6-7:**
- Complete integration validation
- Performance optimization
- Updated documentation
- Sprint completion report

---

## 🔧 Technical Implementation Details

### **Universal `searchUsers` Schema**
```typescript
const SearchUsersSchema = z.object({
  // Basic search
  query: z.string().optional(),
  
  // Mode switching
  mode: z.enum(['all', 'assignable', 'project-members']).default('all'),
  
  // Context for assignable/project modes
  projectKey: z.string().optional(),
  issueKey: z.string().optional(),
  
  // Pagination
  maxResults: z.number().max(1000).default(50),
  startAt: z.number().default(0),
  
  // Additional filtering
  active: z.boolean().optional(),
  includeInactive: z.boolean().default(false)
});
```

### **Mode-Based User Search Logic**
```typescript
async function searchUsersImpl(params: SearchUsersParams, context: any) {
  const { mode, projectKey, issueKey, query } = params;
  
  switch (mode) {
    case 'assignable':
      if (issueKey) {
        return searchAssignableUsersForIssue(issueKey, query, context);
      } else if (projectKey) {
        return searchAssignableUsersForProject(projectKey, query, context);
      }
      throw new Error('Assignable mode requires projectKey or issueKey');
      
    case 'project-members':
      if (!projectKey) {
        throw new Error('Project-members mode requires projectKey');
      }
      return searchProjectMembers(projectKey, query, context);
      
    case 'all':
    default:
      return searchAllUsers(query, context);
  }
}
```

### **Enhanced `getBoardIssues` Schema**
```typescript
const GetBoardIssuesSchema = z.object({
  boardId: z.number(),
  
  // Scope filtering
  scope: z.enum(['all', 'backlog', 'active-sprints', 'done-sprints']).default('all'),
  
  // Additional filtering
  issueTypes: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
  assignee: z.string().optional(),
  
  // Search within board
  jql: z.string().optional(),
  
  // Pagination
  maxResults: z.number().max(1000).default(50),
  startAt: z.number().default(0),
  
  // Response expansion
  expand: z.array(z.string()).optional()
});
```

### **Scope-Based Board Issue Logic**
```typescript
async function getBoardIssuesImpl(params: GetBoardIssuesParams, context: any) {
  const { boardId, scope } = params;
  
  let endpoint: string;
  let additionalParams: Record<string, any> = {};
  
  switch (scope) {
    case 'backlog':
      endpoint = `/rest/agile/1.0/board/${boardId}/backlog`;
      break;
      
    case 'active-sprints':
      endpoint = `/rest/agile/1.0/board/${boardId}/issue`;
      additionalParams.jql = 'sprint in openSprints()';
      break;
      
    case 'done-sprints':
      endpoint = `/rest/agile/1.0/board/${boardId}/issue`;
      additionalParams.jql = 'sprint in closedSprints()';
      break;
      
    case 'all':
    default:
      endpoint = `/rest/agile/1.0/board/${boardId}/issue`;
      break;
  }
  
  return fetchBoardIssues(endpoint, params, additionalParams, context);
}
```

---

## 🧪 Testing Strategy

### **User Search Testing**
```typescript
UNIT TESTS:
- All mode combinations (all, assignable, project-members)
- Permission boundary testing
- Invalid context handling (missing projectKey, etc.)
- Pagination edge cases

INTEGRATION TESTS:
- User assignment workflows
- Project context validation
- Performance vs specialized tools
- Large user base handling

PERFORMANCE TESTS:
- Response time for different modes
- Memory usage optimization
- Concurrent search handling
- Cache effectiveness
```

### **Board Issues Testing**
```typescript
UNIT TESTS:
- All scope combinations (all, backlog, active, done)
- Board permission validation
- Invalid board handling
- Pagination consistency

INTEGRATION TESTS:
- Board workflow integration
- Sprint state filtering accuracy
- JQL combination with scope
- Response format consistency

PERFORMANCE TESTS:
- Large board performance
- Scope filtering efficiency
- Memory usage for large result sets
- Concurrent board access
```

---

## 📊 Success Metrics

### **Consolidation Metrics**
- ✅ User tools: 3 → 1 (67% reduction)
- ✅ Board tools: 2 → 1 (50% reduction)
- ✅ Total progress: 59 → 55 tools (7% reduction so far)
- ✅ Enhanced functionality vs specialized tools

### **Performance Metrics**
- ✅ searchUsers response time ≤ 110% vs specialized tools
- ✅ getBoardIssues performance ≤ 105% vs original
- ✅ Memory usage ≤ 115% of baseline
- ✅ 100% backward compatibility maintained

### **Quality Metrics**
- ✅ 95%+ test coverage for new tools
- ✅ Zero critical bugs in consolidated tools
- ✅ Complete AI-friendly documentation
- ✅ Integration workflows validated

---

## 🔄 Integration Points

### **Enhanced User Search Integration**
```typescript
// Integration with issue assignment
const assignableUsers = await searchUsers({
  mode: 'assignable',
  projectKey: 'DEMO',
  query: 'john'
});

// Integration with project management
const projectMembers = await searchUsers({
  mode: 'project-members',
  projectKey: 'DEMO'
});
```

### **Enhanced Board Issues Integration**
```typescript
// Integration with sprint planning
const backlogIssues = await getBoardIssues({
  boardId: 123,
  scope: 'backlog',
  issueTypes: ['Story', 'Task']
});

// Integration with sprint management
const activeSprintIssues = await getBoardIssues({
  boardId: 123,
  scope: 'active-sprints'
});
```

---

## 🚨 Risk Mitigation

### **Technical Risks**
⚠️ **User Permission Complexity**: Different permission models for different modes  
→ **Mitigation**: Comprehensive permission testing + clear error messages

⚠️ **Board Scope Complexity**: Different API endpoints for different scopes  
→ **Mitigation**: Unified response formatting + consistent error handling

⚠️ **Performance Regression**: Consolidated tools might be slower  
→ **Mitigation**: Performance benchmarking + optimization + acceptable thresholds

### **Integration Risks**
⚠️ **Workflow Disruption**: Changes might break existing workflows  
→ **Mitigation**: Backward compatibility + gradual migration + rollback plan

⚠️ **Data Consistency**: Different data sources might have inconsistencies  
→ **Mitigation**: Response normalization + data validation + error handling

---

## 📝 Definition of Done

### **Consolidated Tools Ready**
- [x] Universal searchUsers with all modes working
- [x] Enhanced getBoardIssues with scope filtering
- [x] Mode switching and context awareness functional
- [x] Performance within acceptable thresholds

### **Testing Complete**
- [x] 95%+ unit test coverage for new tools
- [x] Integration tests passing for all workflows
- [x] Performance regression tests passed
- [x] Manual testing of all scenarios completed

### **Documentation Updated**
- [x] AI-friendly tool descriptions with usage patterns
- [x] Mode switching documentation clear
- [x] Integration examples provided
- [x] Performance benchmarks documented

### **Quality Assurance**
- [x] Code review completed and approved
- [x] No critical or high severity bugs
- [x] Backward compatibility verified
- [x] Integration workflows validated

---

## 🔄 Dependencies & Handoffs

### **Sprint 5.1 Dependencies**
- Enhanced core issue tools operational
- Performance baselines established
- Integration patterns documented
- Test infrastructure ready

### **Sprint 5.2 → Sprint 5.3 Handoffs**
- User and board consolidation complete
- Integration patterns validated
- Performance benchmarks available
- Migration strategy documented

---

*Sprint 5.2 Plan*  
*Created: August 9, 2025*  
*Target: User & board tool consolidation (55 tools)*  
*Progress: 59 → 55 tools (-7% consolidation)*
