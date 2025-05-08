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
| Issues | `jira://issues` | Danh sách issues, hỗ trợ JQL, phân trang | `/rest/api/3/search` | Array của Issue objects, có phân trang |
| Issue Details | `jira://issues/{issueKey}` | Chi tiết issue | `/rest/api/3/issue/{issueKey}` | Single Issue object với description (ADF→text) |
| Issue Transitions | `jira://issues/{issueKey}/transitions` | Danh sách transitions | `/rest/api/3/issue/{issueKey}/transitions` | Array của Transition objects |
| Issue Comments | `jira://issues/{issueKey}/comments` | Danh sách comment | `/rest/api/3/issue/{issueKey}/comment` | Array của Comment objects với body (ADF→text) |
| Projects | `jira://projects` | Danh sách project | `/rest/api/3/project` | Array của Project objects |
| Project Details | `jira://projects/{projectKey}` | Chi tiết project | `/rest/api/3/project/{projectKey}` | Single Project object |
| Project Roles | `jira://projects/{projectKey}/roles` | Danh sách role của project | `/rest/api/3/project/{projectKey}/role` | Array các role (name, id) |
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
| Spaces | `confluence://spaces` | Danh sách không gian | `/rest/api/space` | Array của Space objects |
| Space Details | `confluence://spaces/{spaceKey}` | Chi tiết không gian | `/rest/api/space/{spaceKey}` | Single Space object |
| Pages | `confluence://pages` | Danh sách trang | `/rest/api/content/search` | Array của Page objects |
| Page Details | `confluence://pages/{pageId}` | Chi tiết trang | `/rest/api/content/{pageId}` | Single Page object với content/body |
| Page Children | `confluence://pages/{pageId}/children` | Danh sách trang con | `/rest/api/content/{pageId}/child/page` | Array của Page objects |
| Page Ancestors | `confluence://pages/{pageId}/ancestors` | Danh sách tổ tiên | `/rest/api/content/{pageId}?expand=ancestors` | Array của Page objects |
| Page Labels | `confluence://pages/{pageId}/labels` | Nhãn của trang | `/rest/api/content/{pageId}/label` | Array của Label objects |
| Page Attachments | `confluence://pages/{pageId}/attachments` | Tập tin đính kèm | `/rest/api/content/{pageId}/child/attachment` | Array của Attachment objects |
| Page Versions | `confluence://pages/{pageId}/versions` | Lịch sử phiên bản | `/rest/api/content/{pageId}/version` | Array của Version objects |

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
| createPage | Tạo trang mới | spaceKey, title, content | `/rest/api/content` | Page ID mới |
| updatePage | Cập nhật trang | pageId, title, content, version | `/rest/api/content/{pageId}` (PUT) | Status của update |
| addComment | Thêm comment vào page | pageId, content | `/rest/api/content` (type=comment) | Comment mới |
| addLabelsToPage | Thêm nhãn vào trang | pageId, labels | `/rest/api/content/{pageId}/label` | Status của thêm |
| removeLabelsFromPage | Xóa nhãn khỏi trang | pageId, labels | `/rest/api/content/{pageId}/label?name=...` | Status của xoá |

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
    'jira-custom-resource',
    new ResourceTemplate('jira://custom/{param}', { list: undefined }),
    'Custom resource description',
    async (params, { config, uri }) => {
      // Code gọi API và xử lý dữ liệu
    }
  );
}
```

### 2. Xử lý ADF trong Tools

Khi gửi request tạo/cập nhật thông tin, API v3 yêu cầu ADF:

```typescript
// Helpers chuyển text thành ADF:
function textToAdf(text: string) {
  return {
    version: 1,
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{ type: 'text', text: text }]
    }]
  };
}

// Sử dụng trong tool:
if (params.description) {
  fields.description = textToAdf(params.description);
}
```

### 3. Common Issues & Solutions

- **Version Conflicts trong Confluence**: Luôn lấy version hiện tại trước khi update
- **JQL Special Characters**: Cần encode các ký tự đặc biệt trong JQL parameters
- **Empty DELETE Response**: Khi xóa label hoặc resource, Atlassian có thể trả về body rỗng

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