# MCP Atlassian Server: Resources & Tools Reference

Tài liệu này liệt kê đầy đủ các Resource (truy vấn dữ liệu) và Tool (thao tác) mà MCP Atlassian Server hỗ trợ, kèm endpoint Atlassian API thực tế và thông tin kỹ thuật chi tiết dành cho developers.

## Hướng dẫn dành cho Developers

Tài liệu này cung cấp thông tin chi tiết về implementation, API endpoints, cấu trúc dữ liệu, và các lưu ý kỹ thuật quan trọng để:

- Hiểu cách Resource và Tool được triển khai
- Thêm mới hoặc mở rộng Resource/Tool
- Xử lý các trường hợp đặc biệt (ADF, version conflicts, error handling)
- Debugging và maintenance

## Resources

Resources là các endpoint chỉ đọc, trả về dữ liệu từ Atlassian theo mẫu URI: `jira://resource-name` hoặc `confluence://resource-name`.

### Jira Resources

| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về | 
|----------|-----|-------|-----------------------|----------------|
| Projects | `jira://projects` | Danh sách project | `/rest/api/3/project` | Array của Project objects |
| Project Details | `jira://projects/{projectKey}` | Chi tiết project | `/rest/api/3/project/{projectKey}` | Single Project object |
| Project Roles | `jira://projects/{projectKey}/roles` | Danh sách role của project | `/rest/api/3/project/{projectKey}/role` | Array các role (name, id) |
| Issues | `jira://issues` | Danh sách issues, hỗ trợ JQL, phân trang | `/rest/api/3/search` | Array của Issue objects, có phân trang |
| Issue Details | `jira://issues/{issueKey}` | Chi tiết issue | `/rest/api/3/issue/{issueKey}` | Single Issue object với description (ADF→text) |
| Issue Transitions | `jira://issues/{issueKey}/transitions` | Danh sách transitions | `/rest/api/3/issue/{issueKey}/transitions` | Array của Transition objects |
| Issue Comments | `jira://issues/{issueKey}/comments` | Danh sách comment | `/rest/api/3/issue/{issueKey}/comment` | Array của Comment objects với body (ADF→text) |
| User Details | `jira://users/{accountId}` | Thông tin user | `/rest/api/3/user?accountId=...` | Single User object |
| Assignable Users | `jira://users/assignable/{projectKey}` | User có thể gán cho issue | `/rest/api/3/user/assignable/search?project=...` | Array của User objects |
| Users by Role | `jira://users/role/{projectKey}/{roleId}` | User theo role trong project | `/rest/api/3/project/{projectKey}/role/{roleId}` | Array của User objects |
| Filters | `jira://filters` | Danh sách filter | `/rest/api/3/filter/search` | Array của Filter objects |
| Filter Details | `jira://filters/{filterId}` | Chi tiết filter | `/rest/api/3/filter/{filterId}` | Single Filter object |
| My Filters | `jira://filters/my` | Filter của tôi | `/rest/api/3/filter/my` | Array của Filter objects |
| Boards | `jira://boards` | Danh sách board | `/rest/agile/1.0/board` | Array của Board objects |
| Board Details | `jira://boards/{boardId}` | Chi tiết board | `/rest/agile/1.0/board/{boardId}` | Single Board object |
| Board Issues | `jira://boards/{boardId}/issues` | Issues trong board | `/rest/agile/1.0/board/{boardId}/issue` | Array của Issue objects |
| Board Sprints | `jira://boards/{boardId}/sprints` | Sprints trong board | `/rest/agile/1.0/board/{boardId}/sprint` | Array của Sprint objects |
| Sprint Details | `jira://sprints/{sprintId}` | Chi tiết sprint | `/rest/agile/1.0/sprint/{sprintId}` | Single Sprint object |
| Sprint Issues | `jira://sprints/{sprintId}/issues` | Issues trong sprint | `/rest/agile/1.0/sprint/{sprintId}/issue` | Array của Issue objects |
| Dashboards | `jira://dashboards` | Danh sách dashboard | `/rest/api/3/dashboard` | Array của Dashboard objects |
| My Dashboards | `jira://dashboards/my` | Dashboard của tôi | `/rest/api/3/dashboard?filter=my` | Array của Dashboard objects |
| Dashboard Details | `jira://dashboards/{dashboardId}` | Chi tiết dashboard | `/rest/api/3/dashboard/{dashboardId}` | Single Dashboard object |
| Dashboard Gadgets | `jira://dashboards/{dashboardId}/gadgets` | Danh sách gadget của dashboard | `/rest/api/3/dashboard/{dashboardId}/gadget` | Array của Gadget objects |

#### Cấu trúc dữ liệu chính

**Issue Object Schema**:  
```
{
  "id": "string",
  "key": "string", 
  "summary": "string",
  "description": "string", // Đã convert từ ADF sang text
  "rawDescription": object|string, // ADF nguyên bản
  "status": { "name": "string", "id": "string" },
  "assignee": { "displayName": "string", "accountId": "string" }, 
  "reporter": { "displayName": "string", "accountId": "string" },
  "priority": { "name": "string", "id": "string" },
  "created": "date-time",
  "updated": "date-time",
  "issueType": { "name": "string", "id": "string" },
  "projectKey": "string",
  "projectName": "string",
  "url": "string"
}
```

**Comment Object Schema**:
```
{
  "id": "string",
  "body": "string", // Đã convert từ ADF sang text
  "rawBody": object|string, // ADF nguyên bản
  "author": { "displayName": "string", "accountId": "string" },
  "created": "date-time",
  "updated": "date-time"
}
```

### Confluence Resources

| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Spaces | `confluence://spaces` | Danh sách không gian | `/wiki/api/v2/spaces` | Array của Space objects (v2) |
| Space Details | `confluence://spaces/{spaceKey}` | Chi tiết không gian | `/wiki/api/v2/spaces/{spaceKey}` | Single Space object (v2) |
| Pages | `confluence://pages` | Danh sách trang (hỗ trợ filter, phân trang) | `/wiki/api/v2/pages` | Array của Page objects (v2) |
| Page Details | `confluence://pages/{pageId}` | Chi tiết trang | `/wiki/api/v2/pages/{pageId}` + `/wiki/api/v2/pages/{pageId}/body` | Single Page object với content/body (v2) |
| Page Children | `confluence://pages/{pageId}/children` | Danh sách trang con | `/wiki/api/v2/pages/{pageId}/children` | Array của Page objects (v2) |
| Page Ancestors | `confluence://pages/{pageId}/ancestors` | Danh sách tổ tiên | `/wiki/api/v2/pages/{pageId}/ancestors` | Array của Page objects (v2) |
| Page Comments | `confluence://pages/{pageId}/comments` | Danh sách comment (footer + inline) | `/wiki/api/v2/pages/{pageId}/footer-comments`, `/wiki/api/v2/pages/{pageId}/inline-comments` | Array của Comment objects (v2) |
| Page Attachments | `confluence://pages/{pageId}/attachments` | Tập tin đính kèm | `/wiki/api/v2/pages/{pageId}/attachments` | Array của Attachment objects (v2) |
| Page Versions | `confluence://pages/{pageId}/versions` | Lịch sử phiên bản | `/wiki/api/v2/pages/{pageId}/versions` | Array của Version objects (v2) |

## Tools

Tools là các endpoint thực hiện hành động, có thể tạo, cập nhật, hoặc sửa đổi dữ liệu trong Atlassian.

### Jira Tools

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createIssue | Tạo issue mới | projectKey, summary, ... | `/rest/api/3/issue` | Issue key và ID mới |
| updateIssue | Cập nhật issue | issueKey, summary, ... | `/rest/api/3/issue/{issueIdOrKey}` | Status của update |
| transitionIssue | Chuyển trạng thái issue | issueKey, transitionId | `/rest/api/3/issue/{issueIdOrKey}/transitions` | Status của transition |
| assignIssue | Gán issue cho user | issueKey, accountId | `/rest/api/3/issue/{issueIdOrKey}/assignee` | Status của assignment |
| createFilter | Tạo filter | name, jql, description, favourite | `/rest/api/3/filter` | Filter ID mới |
| updateFilter | Cập nhật filter | filterId, name, jql, description, favourite | `/rest/api/3/filter/{filterId}` | Status của update |
| deleteFilter | Xóa filter | filterId | `/rest/api/3/filter/{filterId}` | Status của xoá |
| createSprint | Tạo sprint | boardId, name, startDate, endDate, goal | `/rest/agile/1.0/sprint` | Sprint ID mới |
| addIssueToBoard | Thêm issue vào board | boardId, issueKey | `/rest/agile/1.0/board/{boardId}/issue` | Status của thêm |
| configureBoardColumns | Cấu hình cột board | boardId, columns | `/rest/agile/1.0/board/{boardId}/column` | Status của cấu hình |
| startSprint | Bắt đầu sprint | sprintId, startDate, endDate, goal | `/rest/agile/1.0/sprint/{sprintId}/start` | Status của bắt đầu |
| closeSprint | Đóng sprint | sprintId, completeDate, moveToSprintId, createNewSprint | `/rest/agile/1.0/sprint/{sprintId}/close` | Status của đóng |
| moveIssuesBetweenSprints | Di chuyển issue giữa các sprint | fromSprintId, toSprintId, issueKeys | `/rest/agile/1.0/sprint/{fromSprintId}/issue/{issueKey}/move` | Status của di chuyển |
| addIssuesToBacklog | Thêm issue vào backlog | boardId, issueKeys | `/rest/agile/1.0/board/{boardId}/issue` | Status của thêm |
| removeIssuesFromBacklog | Xóa issue khỏi backlog | boardId, sprintId, issueKeys | `/rest/agile/1.0/sprint/{sprintId}/issue/{issueKey}/remove` | Status của xóa |
| rankBacklogIssues | Sắp xếp thứ tự backlog | boardId, issueKeys, rankBeforeIssue, rankAfterIssue | `/rest/agile/1.0/board/{boardId}/issue/{issueKey}/rank` | Status của sắp xếp |
| createDashboard | Tạo dashboard | name, description, sharePermissions | `/rest/api/3/dashboard` | Dashboard ID mới |
| updateDashboard | Cập nhật dashboard | dashboardId, name, description, sharePermissions | `/rest/api/3/dashboard/{dashboardId}` | Status của update |
| addGadgetToDashboard | Thêm gadget vào dashboard | dashboardId, uri, color, position, title, properties | `/rest/api/3/dashboard/{dashboardId}/gadget` | Gadget ID mới |
| removeGadgetFromDashboard | Xóa gadget khỏi dashboard | dashboardId, gadgetId | `/rest/api/3/dashboard/{dashboardId}/gadget/{gadgetId}` | Status của xóa |

#### Cấu trúc dữ liệu input quan trọng

**createIssue**:
```
{
  "projectKey": "string", // (bắt buộc) Project key
  "summary": "string", // (bắt buộc) Tiêu đề issue
  "description": "string", // Mô tả (sẽ tự convert sang ADF)
  "issueType": "string", // Loại issue (default: "Task") 
  "priority": "string", // Độ ưu tiên
  "assignee": "string", // accountId của người được gán
  "labels": "string[]" // Nhãn
}
```

### Confluence Tools

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createPage | Tạo trang mới | spaceId, title, content, parentId | `/wiki/api/v2/pages` | Page ID mới |
| updatePage | Cập nhật trang | pageId, title, content, version | `/wiki/api/v2/pages/{pageId}` (PUT) | Status của update |
| updatePageTitle | Cập nhật tiêu đề trang | pageId, title, version | `/wiki/api/v2/pages/{pageId}/title` (PUT) | Status của update |
| addComment | Thêm comment footer vào page | pageId, content | `/wiki/api/v2/footer-comments` | Comment mới |
| updateFooterComment | Cập nhật comment | commentId, version, value, representation, message | `/wiki/api/v2/footer-comments/{commentId}` (PUT) | Status của update |
| deleteFooterComment | Xóa comment | commentId | `/wiki/api/v2/footer-comments/{commentId}` (DELETE) | Status của xóa |
| deletePage | Xóa trang | pageId, draft, purge | `/wiki/api/v2/pages/{pageId}` (DELETE) | Status của xóa |

## Migration Notes (API v2 → v3)

**Việc migrate từ API v2 sang v3 (Tháng 6/2025):**

1. **Thay đổi Endpoint**: Toàn bộ endpoint `/rest/api/2/...` đã chuyển thành `/rest/api/3/...`

2. **Xử lý ADF**: 
   - API v3 trả về các trường như `description`, `comment` ở định dạng ADF (Atlassian Document Format), thay vì text thuần  
   - Đã thêm hàm `extractTextFromADF()` để tự động chuyển ADF thành text trong các trường:
     - Issue description (issue.fields.description)
     - Comment body (comment.body)

3. **Schema Update**:
   - Đã cập nhật schema để hỗ trợ cả dạng ADF và text thuần
   - Thêm trường `rawDescription` và `rawBody` để lưu giữ data ADF nguyên bản
   - Đảm bảo backward compatibility

4. **Files Update**:
   - `src/resources/jira/*.ts`: Cập nhật endpoint URLs và xử lý ADF
   - `src/schemas/jira.ts`: Cập nhật schema để hỗ trợ ADF

## Implementation Details

### Cấu trúc Code

```
src/
  resources/           # Các resource (read-only)
    jira/              # Resource Jira
      issues.ts        # Issues, comments, transitions
      projects.ts      # Projects, roles
      users.ts         # User details, assignable users
    confluence/        # Resource Confluence
      spaces.ts        # Spaces
      pages.ts         # Pages, child pages, content
  tools/               # Các tool (actions/mutations)
    jira/              # Tool Jira
      create-issue.ts
      update-issue.ts
      transition-issue.ts
      assign-issue.ts
    confluence/        # Tool Confluence
      create-page.ts
      update-page.ts
      add-comment.ts
  schemas/             # Schema validation
    jira.ts            # Schema cho Jira resources/tools
    confluence.ts      # Schema cho Confluence resources/tools
  utils/               # Common utilities
    atlassian-api.js   # Xử lý API calls, authentication
    mcp-resource.js    # Helper functions cho MCP resources
```

### Xử lý ADF

ADF (Atlassian Document Format) là định dạng rich text phức tạp. Hàm chuyển đổi sang text:

```typescript
function extractTextFromADF(adf: any): string {
  if (!adf || typeof adf === 'string') return adf || '';
  let text = '';
  if (adf.content) {
    adf.content.forEach((node: any) => {
      if (node.type === 'paragraph' && node.content) {
        node.content.forEach((inline: any) => {
          if (inline.type === 'text') {
            text += inline.text;
          }
        });
        text += '\n';
      }
    });
  }
  return text.trim();
}
```

## Best Practices

1. **Start Simple**: Begin with basic queries and parameters
2. **Check Permissions**: Ensure the Atlassian account has access to the projects/spaces
3. **Handle Errors**: Always check for error responses
4. **Chain Resources and Tools**: Use resources to get information before performing actions with tools
5. **Use Clear Examples**: When instructing AI assistants, provide clear examples of what you want

## Developer Tips

### 1. Extending Resources

Để thêm resource mới:

1. Tạo file trong thư mục tương ứng (src/resources/jira/ hoặc src/resources/confluence/)
2. Định nghĩa function để gọi API Atlassian
3. Tạo resource trong server với `server.resource()` hoặc `registerResource()`
4. Thêm schema vào file schema tương ứng
5. Import/export thích hợp

```typescript
// Template add resource mới
export function registerCustomResource(server: McpServer) {
  // Resource: Custom resource
  registerResource(
    server,
    'resource-id',
    new ResourceTemplate('jira://custom-path', { list: undefined }),
    'Description of resource',
    async (params, { config, uri }) => {
      // Call API and return data
    }
  );
}
```

## Chuẩn triển khai API

Để đảm bảo tính nhất quán, an toàn và dễ bảo trì, tất cả các Resource và Tool **phải** tuân theo các nguyên tắc sau:

### 1. Tập trung API calls qua atlassian-api.ts

- **Không tự gọi `fetch()`**: Không tự triển khai API calls trong Resource/Tool, mà phải sử dụng các hàm helper trong `src/utils/atlassian-api.ts`.
- **Không tự build headers/URL**: Không tự xây dựng authentication headers hoặc URL, để tránh trùng lặp code và tiềm ẩn lỗi.

```typescript
// ❌ KHÔNG làm như này
async function getCustomData(config: AtlassianConfig) {
  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  const headers = { 'Authorization': `Basic ${auth}`, ... };
  const response = await fetch(`${config.baseUrl}/rest/api/3/custom`, { headers });
  return await response.json();
}

// ✅ Nên làm như này
import { getCustomData } from '../../utils/atlassian-api.js';
async function fetchCustomData(config: AtlassianConfig) {
  return await getCustomData(config);
}
```

### 2. Bổ sung helper function trong atlassian-api.ts

Khi cần thêm API endpoint mới, hãy tạo helper function mới trong `src/utils/atlassian-api.ts`:

```typescript
// Thêm vào atlassian-api.ts
export async function getCustomData(config: AtlassianConfig, param: string): Promise<any> {
  return await callJiraApi<any>(
    config,
    `/rest/api/3/custom?param=${encodeURIComponent(param)}`,
    'GET'
  );
}
```

Hoặc sử dụng hàm generic `callJiraApi` và `callConfluenceApi` cho các endpoint không thường xuyên dùng.

### 3. Xử lý lỗi nhất quán

- Sử dụng lớp `ApiError` cho mọi lỗi API.
- Xử lý các HTTP status code một cách nhất quán (401, 403, 404, 429).
- Log đầy đủ thông tin lỗi.

### 4. Versioning và Backward Compatibility

- Khi update API version (v1 → v2 → v3), giữ lại các hàm cũ với dấu hiệu deprecated.
- Đặt tên hàm helper thể hiện rõ version API: `getConfluencePageV2`, `getJiraIssueV3`.
- Hỗ trợ cả các định dạng cũ (như text) và mới (như ADF) trong schema trả về.

### 5. Cấu trúc Resource file và Tool file

Resource file:
```typescript
// 1. Imports
import { ... } from '../../utils/atlassian-api.js';

// 2. Helper functions (đơn giản, gọi các hàm từ atlassian-api.ts)
async function getSomeData(config, param) {
  return await getSomeDataFromApi(config, param);
}

// 3. Resource registration
export function registerSomeResource(server) {
  registerResource(
    server,
    'resource-id',
    new ResourceTemplate('jira://some-path', ...),
    'Description',
    async (params, { config, uri }) => {
      // Call helper function
      const data = await getSomeData(config, params.someParam);
      // Format data and return
      return createStandardResource(...);
    }
  );
}
```

Tool file:
```typescript
// 1. Imports
import { ... } from '../../utils/atlassian-api.js';

// 2. Handler function
export async function someToolHandler(params, config) {
  try {
    // Call API helper function
    const result = await someFunctionFromApi(config, params);
    return { success: true, data: result };
  } catch (error) {
    // Error handling
  }
}

// 3. Tool registration
export const registerSomeTool = (server) => {
  server.tool(
    'tool-name',
    'Description',
    someSchema.shape,
    async (params, context) => {
      // Call handler
      const result = await someToolHandler(params, context.config);
      return createResponse(...);
    }
  );
};
```

Tuân thủ các nguyên tắc trên sẽ giúp codebase luôn nhất quán, dễ bảo trì, và dễ mở rộng khi cần.

## Common Workflows

### Project Management

1. Get project list: `jira://projects`
2. View issues in project: `jira://issues?jql=project=DEMO`
3. Create new issue: Use `createIssue` tool
4. Update status: Use `transitionIssue` tool

### Documentation

1. Get space list: `confluence://spaces`
2. View pages in space: `confluence://spaces/TEAM/pages`
3. Create new page: Use `createPage` tool
4. Add comments: Use `addComment` tool

## What's Coming Next

Future enhancements will include:
- Jira: Filters, Boards, Dashboards, Sprints, Backlog Management
- Confluence: Labels, Attachments, Content Versions History
- Advanced features: Prompts, Sampling, Smart caching, personalization 

**Lưu ý:** Từ tháng 6/2025, toàn bộ resource Jira đã migrate sang API v3 (endpoint `/rest/api/3/...`). Các trường rich text như description/comment trả về dạng ADF, đã tự động chuyển sang text thuần cho client không hỗ trợ ADF. 

> **Lưu ý:** Tất cả resource và tool Confluence hiện tại chỉ sử dụng API v2 (`/wiki/api/v2/`). Các endpoint v1 đã bị loại bỏ hoàn toàn. Schema dữ liệu đã cập nhật theo API v2. 

## Develop Tip: Luôn cập nhật schema khi implement resource/tool mới

- Khi implement resource hoặc tool mới (đặc biệt với Confluence/Jira API v2), **luôn phải cập nhật schema** (ở `src/schemas/...`) cho đúng chuẩn response thực tế của API.
- Nếu không cập nhật schema, phía client (như Cline) sẽ không validate hoặc hiển thị đúng dữ liệu, dẫn đến lỗi hoặc thiếu thông tin.
- Kinh nghiệm thực tế: mỗi khi sửa logic hoặc response của resource/tool, phải kiểm tra và update schema tương ứng. Đặc biệt chú ý các trường required, kiểu dữ liệu, và các trường mới/cũ bị thay đổi do API Atlassian update.
- Nên test lại resource/tool với Cline hoặc client thực tế để đảm bảo schema và dữ liệu trả về đã đồng bộ. 