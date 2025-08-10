# MCP Jira Server v3.0.0: Complete Tools Reference

Tài liệu này liệt kê đầy đủ 53 tools mà MCP Jira Server v3.0.0 hỗ trợ, kèm endpoint Atlassian API thực tế và thông tin kỹ thuật chi tiết dành cho developers.

**Version**: 3.0.0  
**Architecture**: Tools-only (no resources) với Universal/Enhanced tool consolidation  
**Total Tools**: 53 tools (45 core + 8 backward compatibility facades)  
**API Coverage**: Jira Platform API v3 + Agile API v1.0  
**Last Updated**: August 9, 2025 (Sprint 5.3 Complete - Migration & Cleanup with Backward Compatibility)

## Tools by Category

### 1. Issue Management (12 tools)

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| listIssues | Liệt kê issues theo project | projectKey, limit | `/rest/api/3/search` | Array của Issue objects |
| getIssue | Lấy chi tiết issue | issueKey | `/rest/api/3/issue/{issueKey}` | Single Issue object |
| searchIssues | Tìm kiếm issues với JQL | jql, maxResults | `/rest/api/3/search` | Array của Issue objects |
| getIssueTransitions | Lấy transitions khả dụng | issueKey | `/rest/api/3/issue/{issueKey}/transitions` | Array của Transition objects |
| getIssueComments | Lấy comments của issue | issueKey | `/rest/api/3/issue/{issueKey}/comment` | Array của Comment objects |
| createIssue | Tạo issue mới | projectKey, summary, issueType | `/rest/api/3/issue` | Issue key và ID mới |
| updateIssue | Cập nhật issue | issueKey, fields | `/rest/api/3/issue/{issueKey}` | Status của update |
| transitionIssue | Chuyển trạng thái issue | issueKey, transitionId | `/rest/api/3/issue/{issueKey}/transitions` | Status của transition |
| assignIssue | Gán issue cho user | issueKey, accountId | `/rest/api/3/issue/{issueKey}/assignee` | Status của assignment |
| addIssueComment | Thêm comment vào issue | issueKey, body | `/rest/api/3/issue/{issueKey}/comment` | Comment ID mới |
| updateIssueComment | Cập nhật comment | issueKey, commentId, body | `/rest/api/3/issue/{issueKey}/comment/{commentId}` | Status của update |
| deleteIssue | Xóa issue | issueKey | `/rest/api/3/issue/{issueKey}` | Status của xóa |

### 2. Project Management (2 tools)

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| listProjects | Liệt kê projects | limit | `/rest/api/3/project` | Array của Project objects |
| getProject | Lấy chi tiết project | projectKey | `/rest/api/3/project/{projectKey}` | Single Project object |

### 3. User Management (2 tools) - **CONSOLIDATED**

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| getUser | Lấy thông tin user | accountId | `/rest/api/3/user` | Single User object |
| **searchUsers** | **UNIVERSAL USER SEARCH** - Thay thế 3 tools | **mode** (all/assignable/project-members), query, projectKey, issueKey | Multiple endpoints theo mode | Array của User objects với statistics |

**🔄 Tool Consolidation (Sprint 5.2)**:
- ~~listUsers~~ → **searchUsers** (mode: "all")
- ~~getAssignableUsers~~ → **searchUsers** (mode: "assignable") 
- **3 → 1 tool consolidation (66% reduction)**

### 4. Board Management (5 tools) - **CONSOLIDATED**

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| listBoards | Liệt kê boards | projectKeyOrId, type | `/rest/agile/1.0/board` | Array của Board objects |
| getBoard | Lấy chi tiết board | boardId | `/rest/agile/1.0/board/{boardId}` | Single Board object |
| **getBoardIssues** | **ENHANCED BOARD ISSUES** - Thay thế 2 tools | boardId, **scope** (all/backlog/active-sprints/done-sprints), sprintId, jql | Multiple endpoints theo scope | Array của Issue objects với statistics |
| getBoardConfiguration | Lấy cấu hình board | boardId | `/rest/agile/1.0/board/{boardId}/configuration` | Board config object |
| getBoardSprints | Lấy sprints của board | boardId | `/rest/agile/1.0/board/{boardId}/sprint` | Array của Sprint objects |

**🔄 Tool Consolidation (Sprint 5.2)**:
- ~~listBacklogIssues~~ → **getBoardIssues** (scope: "backlog")
- **2 → 1 tool consolidation (50% reduction)**

### 5. Sprint Management (7 tools)

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| listSprints | Liệt kê sprints | boardId | `/rest/agile/1.0/board/{boardId}/sprint` | Array của Sprint objects |
| getSprint | Lấy chi tiết sprint | sprintId | `/rest/agile/1.0/sprint/{sprintId}` | Single Sprint object |
| getSprintIssues | Lấy issues trong sprint | sprintId | `/rest/agile/1.0/sprint/{sprintId}/issue` | Array của Issue objects |
| createSprint | Tạo sprint mới | boardId, name | `/rest/agile/1.0/sprint` | Sprint ID mới |
| startSprint | Bắt đầu sprint | sprintId, startDate, endDate | `/rest/agile/1.0/sprint/{sprintId}` | Status của bắt đầu |
| closeSprint | Đóng sprint | sprintId | `/rest/agile/1.0/sprint/{sprintId}` | Status của đóng |
| addIssueToSprint | Thêm issue vào sprint | sprintId, issueKeys | `/rest/agile/1.0/sprint/{sprintId}/issue` | Status của thêm |
| addIssuesToBacklog | Đưa issues vào backlog | boardId, issueKeys | `/rest/agile/1.0/backlog/issue` | Status của thêm |
| rankBacklogIssues | Sắp xếp thứ tự backlog | boardId, issueKeys | `/rest/agile/1.0/issue/rank` | Status của sắp xếp |

### 6. Filter Management (6 tools)

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| listFilters | Liệt kê filters | expand | `/rest/api/3/filter/search` | Array của Filter objects |
| getFilter | Lấy chi tiết filter | filterId | `/rest/api/3/filter/{filterId}` | Single Filter object |
| getMyFilters | Lấy filters của tôi | expand | `/rest/api/3/filter/my` | Array của Filter objects |
| createFilter | Tạo filter mới | name, jql, description | `/rest/api/3/filter` | Filter ID mới |
| updateFilter | Cập nhật filter | filterId, name, jql | `/rest/api/3/filter/{filterId}` | Status của update |
| deleteFilter | Xóa filter | filterId | `/rest/api/3/filter/{filterId}` | Status của xóa |

### 7. Dashboard & Gadget Management (8 tools)

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| listDashboards | Liệt kê dashboards | filter | `/rest/api/3/dashboard/search` | Array của Dashboard objects |
| getDashboard | Lấy chi tiết dashboard | dashboardId | `/rest/api/3/dashboard/{dashboardId}` | Single Dashboard object |
| getDashboardGadgets | Lấy gadgets trên dashboard | dashboardId | `/rest/api/3/dashboard/{dashboardId}/gadget` | Array của Gadget objects |
| createDashboard | Tạo dashboard mới | name, description | `/rest/api/3/dashboard` | Dashboard ID mới |
| updateDashboard | Cập nhật dashboard | dashboardId, name | `/rest/api/3/dashboard/{dashboardId}` | Status của update |
| addGadgetToDashboard | Thêm gadget vào dashboard | dashboardId, gadgetType | `/rest/api/3/dashboard/{dashboardId}/gadget` | Gadget ID mới |
| removeGadgetFromDashboard | Xóa gadget khỏi dashboard | dashboardId, gadgetId | `/rest/api/3/dashboard/{dashboardId}/gadget/{gadgetId}` | Status của xóa |
| getJiraGadgets | Lấy danh sách gadgets | None | `/rest/api/3/dashboard/gadgets` | Array của available gadgets |

### 8. Fix Version Management (4 tools) - Sprint 4.4

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createFixVersion | Tạo Fix Version mới | projectKey, name, description | `/rest/api/3/version` | Version ID mới |
| listProjectVersions | Liệt kê versions của project | projectKey | `/rest/api/3/project/{projectKey}/version` | Array của Version objects |
| getProjectVersion | Lấy chi tiết version | versionId | `/rest/api/3/version/{versionId}` | Single Version object |
| updateFixVersion | Cập nhật Fix Version | versionId, name, description | `/rest/api/3/version/{versionId}` | Status của update |

### 9. Backward Compatibility Facades (8 tools) - Sprint 5.3

**🚨 DEPRECATED TOOLS - Will be removed in v4.0.0**

| Tool | Mô tả | Migrates To | Enhanced Replacement |
|------|-------|-------------|---------------------|
| createStory | Tạo Story mới | createIssue | Auto-detects Story from epicKey/storyPoints |
| createSubtask | Tạo Sub-task mới | createIssue | Auto-detects Sub-task from parentKey |
| createBulkSubtasks | Tạo nhiều Sub-tasks | Multiple createIssue | Better per-subtask error handling |
| getEpic | Lấy chi tiết Epic | getIssue | Enhanced Epic-specific details |
| updateEpic | Cập nhật Epic | updateIssue | Smart Epic field mapping |
| getEpicIssues | Lấy issues thuộc Epic | searchIssues | JQL: "parent = epicKey" with hierarchy |
| searchEpics | Tìm kiếm Epics | searchIssues | JQL: "issueType = Epic" with progress |
| searchStories | Tìm kiếm Stories | searchIssues | JQL: "issueType = Story" with Epic context |

## API Architecture

### Jira Platform API v3
- **Issues**: CRUD operations, comments, transitions
- **Projects**: Project information and management
- **Users**: User search and assignment operations
- **Filters**: Search filter management
- **Dashboards**: Dashboard and gadget management
- **Fix Versions**: Version management for releases
- **Stories & Sub-tasks**: Issue hierarchy management

### Jira Agile API v1.0
- **Boards**: Agile board management and configuration
- **Sprints**: Sprint lifecycle and issue management
- **Backlog**: Backlog prioritization and ranking
- **Epics**: Epic-specific operations and hierarchy

## Authentication
- **Method**: Basic Authentication
- **Credentials**: API Token (recommended) or Password
- **Headers**: `Authorization: Basic <base64(email:token)>`

## Error Handling
- **Validation**: Zod schema validation for all inputs
- **API Errors**: Comprehensive Jira API error mapping
- **Rate Limiting**: Built-in request throttling
- **Retry Logic**: Automatic retry for transient failures

## Tool Groups by Function

### Read Operations (25 tools)
- Issues: listIssues, getIssue, searchIssues, getIssueTransitions, getIssueComments
- Projects: listProjects, getProject
- Users: getUser, searchUsers, listUsers, getAssignableUsers
- Boards: listBoards, getBoard, getBoardIssues, getBoardConfiguration, getBoardSprints, listBacklogIssues
- Sprints: listSprints, getSprint, getSprintIssues
- Filters: listFilters, getFilter, getMyFilters
- Dashboards: listDashboards, getDashboard, getDashboardGadgets
- Versions: listProjectVersions, getProjectVersion
- Epics: getEpic, getEpicIssues, searchEpics, searchStories

### Write Operations (34 tools)
- Issues: createIssue, updateIssue, transitionIssue, assignIssue, addIssueComment, updateIssueComment, deleteIssue
- Sprints: createSprint, startSprint, closeSprint, addIssueToSprint, addIssuesToBacklog, rankBacklogIssues
- Filters: createFilter, updateFilter, deleteFilter
- Dashboards: createDashboard, updateDashboard, addGadgetToDashboard, removeGadgetFromDashboard, getJiraGadgets
- Versions: createFixVersion, updateFixVersion
- Epics: updateEpic
- Stories: createStory
- Sub-tasks: createSubtask, createBulkSubtasks

## Success Metrics - Sprint 5.3 Migration & Cleanup Complete

- **Total Tools**: 53 tools operational (45 core + 8 backward compatibility facades)
- **Tool Consolidation Strategy**: 
  - **Core Tools**: 45 enhanced tools (59→45, 24% reduction)
  - **Backward Compatibility**: 8 facade tools for smooth migration
  - **Migration Timeline**: Deprecated tools removed in v4.0.0
- **Architecture**: Complete tool consolidation with backward compatibility layer
- **Enhanced Universal Tools**: 4 consolidated tools replacing 16 specialized tools
  - Universal searchUsers: 3→1 tool (66% reduction)
  - Enhanced getBoardIssues: 2→1 tool (50% reduction) 
  - Enhanced createIssue: Intelligent type detection
  - Enhanced searchIssues: Smart filtering with JQL

### Sprint 5.3 Achievements
- **Facade Layer**: 100% backward compatibility maintained during migration
- **Tool Cleanup**: 8 specialized tool files removed successfully
- **Migration Path**: Clear deprecation warnings with migration guidance
- **Production Ready**: Complete backward compatibility for existing integrations

---

*Generated: August 9, 2025*  
*MCP Jira Server v3.0.0 - Complete Tools Reference*  
*Sprint 5.3: Migration & Cleanup Complete - 53 tools (45 core + 8 facades)*
