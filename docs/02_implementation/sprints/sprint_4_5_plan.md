# Sprint 4.5 Plan - Epic, Story & Sub-task Management

**Sprint Duration**: 2 days  
**Start Date**: August 9, 2025  
**Focus Area**: Epic, Story & Sub-task specialized management tools  
**Target**: Expand from 51 → 60+ tools with comprehensive issue hierarchy support

---

## 🎯 Sprint Objectives

### **Primary Goals:**
1. **Epic Management**: Implement specialized Epic tools using Agile API (`/rest/agile/1.0/`)
2. **Story Enhancement**: Enhance existing tools with Story-specific features
3. **Sub-task Support**: Add comprehensive Sub-task creation and management
4. **Hierarchy Management**: Tools for parent-child relationships and Epic links

### **Success Metrics:**
- ✅ **9+ new specialized tools** for Epic/Story/Sub-task management
- ✅ **Enhanced existing tools** with hierarchy awareness
- ✅ **Target**: 60+ total tools operational
- ✅ **100% test coverage** for all new functionality

---

## 📋 Current Tool Analysis

### **Existing Tools with Epic/Story/Sub-task Support:**
1. ✅ **createIssue** - Can create Epic/Story/Sub-task (needs enhancement for hierarchy)
2. ✅ **getIssue** - Returns subtasks and epic info (good foundation)
3. ✅ **updateIssue** - Can update any issue type (needs Epic-specific features)
4. ✅ **searchIssues** - Can search by issue type with JQL (good foundation)
5. ✅ **getSprintIssues** - Returns epic info and story points (good foundation)

### **Tools Requiring Enhancement:**
- **createIssue**: Add parent field support for Sub-tasks
- **searchIssues**: Add Epic-specific JQL helpers
- **getIssue**: Enhance Epic Link field handling

---

## 🚀 New Tools Implementation Plan

### **Category 1: Epic Management Tools (4 tools)**

#### **1. getEpic** ⭐ NEW
- **API**: `GET /rest/agile/1.0/epic/{epicIdOrKey}`
- **Purpose**: Get Epic details with Agile API specific fields
- **Features**:
  - Epic color, done status
  - Epic name and summary
  - Enhanced Epic-specific metadata
- **File**: `src/tools/jira/get-epic.ts`

#### **2. updateEpic** ⭐ NEW  
- **API**: `POST /rest/agile/1.0/epic/{epicIdOrKey}`
- **Purpose**: Update Epic with Agile-specific fields
- **Features**:
  - Update Epic color
  - Set done status
  - Update name and summary
- **File**: `src/tools/jira/update-epic.ts`

#### **3. getEpicIssues** ⭐ NEW
- **API**: `GET /rest/agile/1.0/epic/{epicId}/issue`
- **Purpose**: Get all issues belonging to an Epic
- **Features**:
  - List all Epic's Stories/Tasks
  - Include issue hierarchy info
  - Progress tracking data
- **File**: `src/tools/jira/get-epic-issues.ts`

#### **4. searchEpics** ⭐ NEW
- **API**: `GET /rest/api/2/search?jql=issuetype="Epic"`
- **Purpose**: Search and filter Epics
- **Features**:
  - Epic-specific search parameters
  - Status and progress filtering
  - Project-specific Epic listing
- **File**: `src/tools/jira/search-epics.ts`

### **Category 2: Sub-task Management Tools (3 tools)**

#### **5. createSubtask** ⭐ NEW
- **API**: `POST /rest/api/2/issue/`
- **Purpose**: Create Sub-task with parent relationship
- **Features**:
  - Parent issue specification
  - Sub-task type validation
  - Automatic hierarchy setup
- **File**: `src/tools/jira/create-subtask.ts`

#### **6. createBulkSubtasks** ⭐ NEW
- **API**: `POST /rest/api/2/issue/bulk`
- **Purpose**: Create multiple Sub-tasks for a parent issue
- **Features**:
  - Bulk Sub-task creation
  - Template-based generation
  - Error handling for batch operations
- **File**: `src/tools/jira/create-bulk-subtasks.ts`

#### **7. getSubtasks** 🔄 ENHANCED
- **Enhancement of existing getIssue**: Focus on Sub-task specific details
- **Purpose**: Get Sub-tasks for a parent issue
- **Features**:
  - Enhanced subtask details
  - Progress aggregation
  - Parent-child relationship info
- **File**: Enhancement to `src/tools/jira/get-issue.ts`

### **Category 3: Story Management Tools (2 tools)**

#### **8. createStory** ⭐ NEW
- **API**: `POST /rest/api/2/issue/`
- **Purpose**: Create Story with Story-specific fields
- **Features**:
  - Story points assignment
  - Epic link setup
  - Acceptance criteria field
- **File**: `src/tools/jira/create-story.ts`

#### **9. searchStories** ⭐ NEW
- **API**: `GET /rest/api/2/search?jql=issuetype="Story"`
- **Purpose**: Search Stories with Story-specific filters
- **Features**:
  - Story points filtering
  - Epic grouping
  - Sprint assignment status
- **File**: `src/tools/jira/search-stories.ts`

---

## 🔄 Tool Enhancement Plan

### **Enhancement 1: createIssue Tool**
- **Add Sub-task Support**: Parent field handling
- **Add Epic Link Support**: Epic assignment for Stories/Tasks
- **Add Story Points**: Story points field for Stories

### **Enhancement 2: searchIssues Tool**
- **Add Issue Type Helpers**: Predefined JQL for Epic/Story/Sub-task
- **Add Hierarchy Filters**: Parent/child relationship queries
- **Add Epic Link Filtering**: Search by Epic assignment

### **Enhancement 3: getIssue Tool**
- **Enhanced Epic Data**: Epic Link custom field resolution
- **Enhanced Subtask Data**: Detailed subtask information
- **Story Points Display**: Story points visualization

---

## 📊 Implementation Schedule

### **Day 1: Epic & Story Tools**
**Morning (4 hours):**
- ✅ Implement `getEpic` tool
- ✅ Implement `updateEpic` tool
- ✅ Implement `getEpicIssues` tool

**Afternoon (4 hours):**
- ✅ Implement `searchEpics` tool
- ✅ Implement `createStory` tool
- ✅ Implement `searchStories` tool

### **Day 2: Sub-task Tools & Enhancements**
**Morning (4 hours):**
- ✅ Implement `createSubtask` tool
- ✅ Implement `createBulkSubtasks` tool
- ✅ Enhance existing `getIssue` for subtasks

**Afternoon (4 hours):**
- ✅ Enhance `createIssue` tool
- ✅ Enhance `searchIssues` tool
- ✅ Testing and integration

---

## 🧪 Testing Strategy

### **New Tools Testing:**
- **Unit Tests**: Each new tool with mock API responses
- **Integration Tests**: Real Jira API testing with test data
- **Hierarchy Tests**: Parent-child relationship validation

### **Enhancement Testing:**
- **Regression Tests**: Ensure existing functionality unchanged
- **Compatibility Tests**: Backward compatibility validation
- **Performance Tests**: Response time impact assessment

### **Test Data Requirements:**
- Test Epic with multiple Stories
- Test Story with multiple Sub-tasks
- Test complex hierarchy scenarios

---

## 📚 API Reference Documentation

### **Epic APIs (Agile 1.0):**
```
GET    /rest/agile/1.0/epic/{epicIdOrKey}
POST   /rest/agile/1.0/epic/{epicIdOrKey}
GET    /rest/agile/1.0/epic/{epicId}/issue
```

### **Issue APIs (Platform 2.0):**
```
POST   /rest/api/2/issue/              (Sub-task creation)
POST   /rest/api/2/issue/bulk          (Bulk Sub-task creation)
GET    /rest/api/2/search              (Epic/Story/Sub-task search)
```

### **Custom Fields:**
- **Epic Link**: Custom field for Epic assignment
- **Story Points**: Custom field for Story estimation
- **Parent**: Built-in field for Sub-task hierarchy

---

## 🎯 Success Criteria

### **Technical Criteria:**
- ✅ **9 new/enhanced tools** implemented successfully
- ✅ **60+ total tools** operational (vs current 51)
- ✅ **100% test pass rate** for new functionality
- ✅ **Backward compatibility** maintained

### **Functional Criteria:**
- ✅ **Complete Epic lifecycle** management (create, read, update, search)
- ✅ **Comprehensive Sub-task** support (create, bulk create, hierarchy)
- ✅ **Enhanced Story management** with specific features
- ✅ **Hierarchy relationship** tools working correctly

### **Quality Criteria:**
- ✅ **Consistent API patterns** with existing tools
- ✅ **Comprehensive error handling** for all scenarios
- ✅ **Performance targets** maintained (<500ms average)
- ✅ **Documentation** complete for all new tools

---

## 🔗 Dependencies & Considerations

### **Technical Dependencies:**
- **Jira Agile API access** for Epic management
- **Custom field configuration** for Epic Link and Story Points
- **Sub-task issue types** enabled in projects

### **Operational Considerations:**
- **Test environment** with proper Epic/Story/Sub-task setup
- **Permission requirements** for issue hierarchy management
- **Project configuration** validation for issue types

---

**Sprint 4.5 Planning Complete** ✅  
**Ready for Implementation** 🚀  
**Target Start**: August 9, 2025 (Today)  
**Expected Completion**: August 10, 2025

---

_Sprint 4.5 Plan - Epic, Story & Sub-task Management_  
_Created: August 9, 2025_  
_Version: 1.0_
