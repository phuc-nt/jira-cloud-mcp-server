# Sprint 3.1 Plan: Critical Foundation Tools

> **Phase 3 - Complete Coverage Implementation | Sprint 3.1 READY**  
> **Duration**: January 23-29, 2025 (5 working days)  
> **Scope**: Issues Comments + Boards Foundation (9 tools total)

---

## 🎯 Sprint 3.1 Objectives

### **Coverage Expansion Goals**
- **Current State**: 25 tools (56% coverage)
- **Sprint Target**: +9 tools → 34 tools (76% coverage) 
- **Focus Areas**: Critical read operations for Agile workflows

### **Sprint 3.1 Split Structure**

#### **Sprint 3.1.1: Issues Comments (Jan 23-24)**
**4 tools - Issues workflow completion**

#### **Sprint 3.1.2: Boards Foundation (Jan 25-29)** 
**5 tools - Critical Agile operations**

---

## 📋 Sprint 3.1.1: Issues Comments (2 days)

**Duration**: January 23-24, 2025  
**Goal**: Complete issues workflow with transitions and comments management  
**Priority**: HIGH - Essential for issue lifecycle management

### **Tools to Implement (4 tools)**

| **Tool** | **API Endpoint** | **Priority** | **Est. Hours** |
|----------|------------------|--------------|----------------|
| `getIssueTransitions` | `GET /rest/api/3/issue/{issueKey}/transitions` | HIGH | 2h |
| `getIssueComments` | `GET /rest/api/3/issue/{issueKey}/comment` | HIGH | 2h |
| `addIssueComment` | `POST /rest/api/3/issue/{issueKey}/comment` | MEDIUM | 3h |
| `updateIssueComment` | `PUT /rest/api/3/issue/{issueKey}/comment/{id}` | MEDIUM | 2h |

### **Implementation Plan**

#### **Day 1 (Jan 23): Read Operations**
```yaml
Morning (4h):
  - getIssueTransitions implementation (2h)
  - getIssueComments implementation (2h)

Afternoon (4h):
  - Unit testing for read operations (2h)
  - Integration testing with existing tools (2h)
```

#### **Day 2 (Jan 24): Write Operations**
```yaml
Morning (4h):
  - addIssueComment implementation (3h)
  - updateIssueComment implementation (1h)

Afternoon (4h):
  - Write operations testing (2h)
  - Full sprint 3.1.1 integration testing (2h)
```

### **Success Criteria Sprint 3.1.1**
- [x] 4 issue comment tools functional
- [x] Integration with existing issue tools
- [x] Consistent error handling and validation
- [x] <500ms response time maintained

---

## 🏗️ Sprint 3.1.2: Boards Foundation (3 days)

**Duration**: January 25-29, 2025  
**Goal**: Complete boards read operations - foundation for Agile workflows  
**Priority**: CRITICAL - Required for Sprint/Board management

### **Tools to Implement (5 tools)**

| **Tool** | **API Endpoint** | **Priority** | **Est. Hours** |
|----------|------------------|--------------|----------------|
| `listBoards` | `GET /rest/agile/1.0/board` | CRITICAL | 2h |
| `getBoard` | `GET /rest/agile/1.0/board/{boardId}` | CRITICAL | 2h |
| `getBoardIssues` | `GET /rest/agile/1.0/board/{boardId}/issue` | HIGH | 3h |
| `getBoardConfiguration` | `GET /rest/agile/1.0/board/{boardId}/configuration` | MEDIUM | 2h |
| `getBoardSprints` | `GET /rest/agile/1.0/board/{boardId}/sprint` | HIGH | 3h |

### **Implementation Plan**

#### **Day 1 (Jan 27): Core Board Operations**
```yaml
Morning (4h):
  - listBoards implementation (2h)
  - getBoard implementation (2h)

Afternoon (4h):
  - Basic testing for core operations (2h)
  - Integration with existing sprint tools (2h)
```

#### **Day 2 (Jan 28): Board Content**
```yaml
Morning (4h):
  - getBoardIssues implementation (3h)
  - getBoardConfiguration implementation (1h)

Afternoon (4h):
  - Board content testing (2h)
  - Cross-integration testing (2h)
```

#### **Day 3 (Jan 29): Board Sprints + Integration**
```yaml
Morning (4h):  
  - getBoardSprints implementation (3h)
  - Sprint integration validation (1h)

Afternoon (4h):
  - Complete Sprint 3.1.2 testing (2h)
  - Full Sprint 3.1 integration testing (2h)
```

### **Success Criteria Sprint 3.1.2**
- [x] 5 board tools operational
- [x] Integration with existing sprint creation tools
- [x] Agile workflow foundation complete
- [x] Performance targets maintained

---

## 🔧 Technical Implementation Strategy

### **API Client Pattern**
```typescript
// Consistent pattern for all new tools
import { createJiraApiClient } from '../utils/jira-api-client.js';

async function handleToolExecution(args: ToolArgs, context: any) {
  try {
    const config = getConfigFromContextOrEnv(context);
    const apiClient = createJiraApiClient(config);
    
    const result = await apiClient.get(`/rest/agile/1.0/board`);
    
    return createJsonResponse('jira://boards', result);
  } catch (error) {
    return handleApiError(error, 'listBoards');
  }
}
```

### **Zod Validation Schemas**
```typescript
// Issues Comments
const GetIssueTransitionsSchema = z.object({
  issueKey: z.string(),
  expand: z.string().optional()
});

// Boards
const ListBoardsSchema = z.object({
  projectKeyOrId: z.string().optional(),
  type: z.enum(['scrum', 'kanban']).optional(),
  maxResults: z.number().max(100).default(50)
});
```

### **Error Handling Strategy**
- Consistent ApiError handling for all tools
- Proper HTTP status code mapping
- Meaningful error messages for users
- Graceful degradation for optional parameters

---

## 📊 Sprint 3.1 Success Metrics

### **Quantitative Targets**
- **Tools Implemented**: 9 tools (4 + 5)
- **Coverage Increase**: 56% → 76% (+20%)
- **Performance**: <500ms maintained across all tools
- **Quality**: Zero build errors, consistent patterns

### **Qualitative Goals**
- **Agile Foundation**: Complete boards read operations functional
- **Issue Lifecycle**: Complete comments and transitions support
- **Integration**: Seamless integration with existing 25 tools
- **User Experience**: Consistent tool discovery and usage patterns

---

## 🔄 Dependencies & Risks

### **Dependencies**
- **Existing Tools**: Integration with current 25 tools maintained
- **API Access**: Jira Agile API permissions verified
- **Test Environment**: Live Jira instance for integration testing

### **Risk Mitigation**
- **API Changes**: Use stable Jira API v3 and Agile v1.0 endpoints
- **Performance**: Monitor response times, optimize if needed
- **Integration**: Comprehensive testing with existing tools
- **Scope Creep**: Focus on read operations only, write ops in future sprints

---

## 📈 Sprint 3.1 Timeline Summary

| **Phase** | **Duration** | **Tools** | **Key Deliverables** |
|-----------|--------------|-----------|---------------------|
| **Sprint 3.1.1** | 2 days | 4 tools | Issues comments & transitions |
| **Sprint 3.1.2** | 3 days | 5 tools | Complete boards read operations |
| **Integration** | Ongoing | All 9 | Cross-tool compatibility |

**Total Sprint 3.1**: 5 days, 9 tools, 76% coverage achieved

---

## 🎯 Next Steps (Sprint 3.2)

Following Sprint 3.1 completion:
- **Sprint 3.2**: Sprints & Filters read operations (6 tools)
- **Target**: 34 → 40 tools (89% coverage)
- **Timeline**: January 30 - February 3, 2025

---

_Sprint 3.1 Implementation Plan_  
_Created: January 8, 2025_  
_Phase 3: Complete Coverage Implementation_