# MCP Atlassian Server: Resources & Tools Reference

Tài liệu này liệt kê đầy đủ các Resource (truy vấn dữ liệu) và Tool (thao tác) mà MCP Atlassian Server hỗ trợ, kèm endpoint Atlassian API thực tế và thông tin kỹ thuật chi tiết dành cho developers.

## Hướng dẫn dành cho Developers

Tài liệu này cung cấp thông tin chi tiết về implementation, API endpoints, cấu trúc dữ liệu, và các lưu ý kỹ thuật quan trọng để:

- Hiểu cách Resource và Tool được triển khai
- Thêm mới hoặc mở rộng Resource/Tool
- Xử lý các trường hợp đặc biệt (ADF, version conflicts, error handling)
- Debugging và maintenance

## JIRA

### 1. Issue

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Issues | `jira://issues` | Danh sách issue | `/rest/api/3/search` | Array của Issue objects |
| Issue Details | `jira://issues/{issueKey}` | Chi tiết issue | `/rest/api/3/issue/{issueKey}` | Single Issue object |
| Issue Transitions | `jira://issues/{issueKey}/transitions` | Các transition khả dụng của issue | `/rest/api/3/issue/{issueKey}/transitions` | Array của Transition objects |
| Issue Comments | `jira://issues/{issueKey}/comments` | Danh sách comment của issue | `/rest/api/3/issue/{issueKey}/comment` | Array của Comment objects |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createIssue | Tạo issue mới | projectKey, summary, ... | `/rest/api/3/issue` | Issue key và ID mới |
| updateIssue | Cập nhật issue | issueKey, summary, ... | `/rest/api/3/issue/{issueIdOrKey}` | Status của update |
| transitionIssue | Chuyển trạng thái issue | issueKey, transitionId | `/rest/api/3/issue/{issueIdOrKey}/transitions` | Status của transition |
| assignIssue | Gán issue cho user | issueKey, accountId | `/rest/api/3/issue/{issueIdOrKey}/assignee` | Status của assignment |
| addIssuesToBacklog | Đưa issue vào backlog | boardId, issueKeys | `/rest/agile/1.0/backlog/issue` hoặc `/rest/agile/1.0/backlog/{boardId}/issue` | Status của thêm |
| addIssueToSprint | Đưa issue vào sprint | sprintId, issueKeys | `/rest/agile/1.0/sprint/{sprintId}/issue` | Status của thêm |
| rankBacklogIssues | Sắp xếp thứ tự issue trong backlog | boardId, issueKeys, rankBeforeIssue, rankAfterIssue | `/rest/agile/1.0/backlog/rank` | Status của sắp xếp |

### 2. Project

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về | 
|----------|-----|-------|-----------------------|----------------|
| Projects | `jira://projects` | Danh sách project | `/rest/api/3/project` | Array của Project objects |
| Project Details | `jira://projects/{projectKey}` | Chi tiết project | `/rest/api/3/project/{projectKey}` | Single Project object |
| Project Roles | `jira://projects/{projectKey}/roles` | Danh sách role của project | `/rest/api/3/project/{projectKey}/role` | Array các role (name, id) |

### 3. Board

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Boards | `jira://boards` | Danh sách board | `/rest/agile/1.0/board` | Array của Board objects |
| Board Details | `jira://boards/{boardId}` | Chi tiết board | `/rest/agile/1.0/board/{boardId}` | Single Board object |
| Board Issues | `jira://boards/{boardId}/issues` | Danh sách issue trên board | `/rest/agile/1.0/board/{boardId}/issue` | Array của Issue objects |
| Board Configuration | `jira://boards/{boardId}/configuration` | Cấu hình board | `/rest/agile/1.0/board/{boardId}/configuration` | Board config object |
| Board Sprints | `jira://boards/{boardId}/sprints` | Danh sách sprint trên board | `/rest/agile/1.0/board/{boardId}/sprint` | Array của Sprint objects |

### 4. Sprint

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Sprints | `jira://sprints` | Danh sách tất cả sprints | `/rest/agile/1.0/sprint` | Array của Sprint objects |
| Sprint Details | `jira://sprints/{sprintId}` | Chi tiết sprint | `/rest/agile/1.0/sprint/{sprintId}` | Single Sprint object |
| Sprint Issues | `jira://sprints/{sprintId}/issues` | Danh sách issue trong sprint | `/rest/agile/1.0/sprint/{sprintId}/issue` | Array của Issue objects |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createSprint | Tạo sprint mới | boardId, name, ... | `/rest/agile/1.0/sprint` | Sprint ID mới |
| startSprint | Bắt đầu sprint | sprintId, ... | `/rest/agile/1.0/sprint/{sprintId}/start` | Status của bắt đầu |
| closeSprint | Đóng sprint | sprintId, ... | `/rest/agile/1.0/sprint/{sprintId}/close` | Status của đóng |
| addIssueToSprint | Thêm issue vào sprint | sprintId, issueKeys | `/rest/agile/1.0/sprint/{sprintId}/issue` | Status của thêm |

### 5. Filter

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Filters | `jira://filters` | Danh sách filter | `/rest/api/3/filter/search` | Array của Filter objects |
| Filter Details | `jira://filters/{filterId}` | Chi tiết filter | `/rest/api/3/filter/{filterId}` | Single Filter object |
| My Filters | `jira://filters/my` | Filter của tôi | `/rest/api/3/filter/my` | Array của Filter objects |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createFilter | Tạo filter mới | name, jql, ... | `/rest/api/3/filter` | Filter ID mới |
| updateFilter | Cập nhật filter | filterId, ... | `/rest/api/3/filter/{filterId}` | Status của update |
| deleteFilter | Xóa filter | filterId | `/rest/api/3/filter/{filterId}` | Status của xoá |

### 6. Dashboard & Gadget

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Dashboards | `jira://dashboards` | Danh sách dashboard | `/rest/api/3/dashboard` | Array của Dashboard objects |
| My Dashboards | `jira://dashboards/my` | Dashboard của tôi | `/rest/api/3/dashboard?filter=my` | Array của Dashboard objects |
| Dashboard Details | `jira://dashboards/{dashboardId}` | Chi tiết dashboard | `/rest/api/3/dashboard/{dashboardId}` | Single Dashboard object |
| Dashboard Gadgets | `jira://dashboards/{dashboardId}/gadgets` | Danh sách gadget trên dashboard | `/rest/api/3/dashboard/{dashboardId}/gadget` | Array của Gadget objects |
| Gadgets | `jira://gadgets` | Danh sách gadget | `/rest/api/3/dashboard/gadgets` | Array của Gadget objects |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createDashboard | Tạo dashboard mới | name, ... | `/rest/api/3/dashboard` | Dashboard ID mới |
| updateDashboard | Cập nhật dashboard | dashboardId, ... | `/rest/api/3/dashboard/{dashboardId}` | Status của update |
| addGadgetToDashboard | Thêm gadget vào dashboard | dashboardId, uri, ... | `/rest/api/3/dashboard/{dashboardId}/gadget` | Gadget ID mới |
| removeGadgetFromDashboard | Xóa gadget khỏi dashboard | dashboardId, gadgetId | `/rest/api/3/dashboard/{dashboardId}/gadget/{gadgetId}` | Status của xóa |

### 7. User

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Users | `jira://users` | Danh sách tất cả user | `/rest/api/3/users/search` | Array của User objects |
| User Details | `jira://users/{accountId}` | Thông tin user | `/rest/api/3/user?accountId=...` | Single User object |
| Assignable Users | `jira://users/assignable/{projectKey}` | User có thể gán cho project | `/rest/api/3/user/assignable/search?project=...` | Array của User objects |
| Users by Role | `jira://users/role/{projectKey}/{roleId}` | User theo role trong project | `/rest/api/3/project/{projectKey}/role/{roleId}` | Array của User objects |

---

## CONFLUENCE

### 1. Space

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Spaces | `confluence://spaces` | Danh sách space | `/wiki/api/v2/spaces` | Array của Space objects (v2) |
| Space Details | `confluence://spaces/{spaceKey}` | Chi tiết space | `/wiki/api/v2/spaces/{spaceKey}` | Single Space object (v2) |
| Space Pages | `confluence://spaces/{spaceKey}/pages` | Danh sách page trong space | `/wiki/api/v2/pages?space-id=...` | Array của Page objects (v2) |

### 2. Page

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Pages | `confluence://pages` | Tìm kiếm page theo filter | `/wiki/api/v2/pages` | Array của Page objects (v2) |
| Page Details | `confluence://pages/{pageId}` | Chi tiết page (v2) | `/wiki/api/v2/pages/{pageId}` + `/wiki/api/v2/pages/{pageId}/body` | Single Page object (v2) |
| Page Children | `confluence://pages/{pageId}/children` | Danh sách page con | `/wiki/api/v2/pages/{pageId}/children` | Array của Page objects (v2) |
| Page Ancestors | `confluence://pages/{pageId}/ancestors` | Danh sách ancestor của page | `/wiki/api/v2/pages/{pageId}/ancestors` | Array của Page objects (v2) |
| Page Attachments | `confluence://pages/{pageId}/attachments` | Danh sách file đính kèm | `/wiki/api/v2/pages/{pageId}/attachments` | Array của Attachment objects (v2) |
| Page Versions | `confluence://pages/{pageId}/versions` | Lịch sử version của page | `/wiki/api/v2/pages/{pageId}/versions` | Array của Version objects (v2) |
| Page Labels | `confluence://pages/{pageId}/labels` | Danh sách nhãn của page | `/wiki/api/v2/pages/{pageId}/labels` | Array của Label objects (v2) |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createPage | Tạo page mới | spaceId, title, content, parentId | `/wiki/api/v2/pages` | Page ID mới |
| updatePage | Cập nhật nội dung page | pageId, title, content, version | `/wiki/api/v2/pages/{pageId}` (PUT) | Status của update |
| updatePageTitle | Đổi tiêu đề page | pageId, title, version | `/wiki/api/v2/pages/{pageId}/title` (PUT) | Status của update |
| deletePage | Xóa page | pageId, draft, purge | `/wiki/api/v2/pages/{pageId}` (DELETE) | Status của xóa |

### 3. Comment

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Page Comments | `confluence://pages/{pageId}/comments` | Danh sách comment của page | `/wiki/api/v2/pages/{pageId}/footer-comments`, `/wiki/api/v2/pages/{pageId}/inline-comments` | Array của Comment objects (v2) |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| addComment | Thêm comment vào page | pageId, content | `/wiki/api/v2/footer-comments` | Comment mới |
| updateFooterComment | Cập nhật comment ở footer | commentId, version, value, ... | `/wiki/api/v2/footer-comments/{commentId}` (PUT) | Status của update |
| deleteFooterComment | Xóa comment ở footer | commentId | `/wiki/api/v2/footer-comments/{commentId}` (DELETE) | Status của xóa |

---

## Implementation Details: Hướng dẫn mở rộng Resource & Tool cho Developer

Khi muốn thêm mới **Resource** (truy vấn dữ liệu) hoặc **Tool** (thao tác/mutation) cho Jira hoặc Confluence, hãy làm theo các bước sau:

### 1. Xác định loại bạn muốn thêm
- **Resource**: Trả về dữ liệu, chỉ đọc (GET), ví dụ: danh sách issue, chi tiết project, các comment, v.v.
- **Tool**: Thực hiện hành động/thao tác (POST/PUT/DELETE), ví dụ: tạo issue, cập nhật filter, thêm comment, v.v.

### 2. Chọn đúng thư mục và file
- **Resource**
  - Thêm file mới hoặc cập nhật file trong:
    - `src/resources/jira/` (cho Jira)
    - `src/resources/confluence/` (cho Confluence)
  - Đăng ký resource mới trong file `index.ts` tương ứng (nếu cần).
- **Tool**
  - Thêm file mới hoặc cập nhật file trong:
    - `src/tools/jira/` (cho Jira)
    - `src/tools/confluence/` (cho Confluence)
  - Đăng ký tool mới trong `src/tools/index.ts`.

### 3. Tạo và đăng ký resource

#### Cách mới nhất để đăng ký resource
Trong phiên bản cập nhật, thay vì sử dụng wrapper `registerResource()`, hãy sử dụng trực tiếp `server.resource()`:

```typescript
// Trong file resource (vd: src/resources/jira/your-resource.ts)

// 1. Tạo một hàm để lấy Atlassian config từ environment
function getAtlassianConfigFromEnv(): AtlassianConfig {
  const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
  const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
  const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';

  if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
    throw new Error('Missing Atlassian credentials in environment variables');
  }

  return {
    baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
      ? `https://${ATLASSIAN_SITE_NAME}` 
      : ATLASSIAN_SITE_NAME,
    email: ATLASSIAN_USER_EMAIL,
    apiToken: ATLASSIAN_API_TOKEN
  };
}

// 2. Tạo và đăng ký resource trực tiếp
export function registerYourResource(server: McpServer) {
  server.resource(
    'resource-name',  // Tên resource, dùng để đăng ký và debug
    new ResourceTemplate('resource://pattern/{param}', {  // Template với URI pattern và list callback
      list: async (_extra) => ({
        resources: [
          {
            uri: 'resource://pattern/{param}',
            name: 'Resource Name',
            description: 'Resource description',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, _extra) => {
      try {
        // Lấy config từ environment để đảm bảo có credentials mới nhất
        const config = getAtlassianConfigFromEnv();
        
        // Xử lý params từ URI pattern
        const param = Array.isArray(params.param) ? params.param[0] : params.param;
        
        // Gọi API hoặc xử lý dữ liệu
        const data = await yourApiFunction(config, param);
        
        // Format URI string
        const uriString = typeof uri === 'string' ? uri : uri.href;
        
        // Trả về dữ liệu theo format MCP
        return {
          contents: [{
            uri: uriString,
            mimeType: 'application/json',
            text: JSON.stringify({
              resource: data,
              metadata: { self: uriString } 
            })
          }]
        };
      } catch (error) {
        // Xử lý lỗi
        logger.error(`Error in resource handler:`, error);
        throw error;
      }
    }
  );
}
```

#### Tránh trùng lặp resource
Để tránh trùng lặp resource khi đăng ký (dẫn đến chỉ hiển thị resource cuối cùng được đăng ký), hãy đảm bảo:

1. **Mỗi resource cần có tên (name) duy nhất** khi đăng ký:
```typescript
server.resource('unique-resource-name', ...)
```

2. **Chỉ đăng ký mỗi URI pattern một lần** và không mở rộng cùng một pattern trong nhiều file khác nhau.

3. **Đảm bảo `list` callback luôn trả về đúng URI pattern** và thông tin mô tả resource.

### 4. Sử dụng các helper API đúng chuẩn
- Không tự gọi trực tiếp fetch() hoặc axios trong resource/tool.
- Luôn sử dụng các hàm helper đã có trong:
  - `src/utils/jira-resource-api.ts`, `src/utils/confluence-resource-api.ts` (cho resource)
  - `src/utils/jira-tool-api-v3.ts`, `src/utils/jira-tool-api-agile.ts`, `src/utils/confluence-tool-api.ts` (cho tool)
- Nếu cần gọi API mới, hãy bổ sung helper function vào các file trên.

### 5. Xử lý config và context
- **Cách ưu tiên**: Đối với mỗi file resource, tạo hàm `getAtlassianConfigFromEnv()` riêng để đảm bảo luôn lấy thông tin mới nhất:
```typescript
function getAtlassianConfigFromEnv(): AtlassianConfig {
  // Đọc từ env và trả về AtlassianConfig
}
```

- **Sử dụng context nếu có**: Context được truyền tự động qua `_extra.context` trong handler:
```typescript
async (uri, params, _extra) => {
  let config: AtlassianConfig;
  if (_extra?.context?.atlassianConfig) {
    config = _extra.context.atlassianConfig;
  } else {
    config = getAtlassianConfigFromEnv();
  }
  // Xử lý tiếp...
}
```

### 6. Định nghĩa schema dữ liệu
- Mỗi resource/tool mới **bắt buộc phải có schema** validate input/output.
- Thêm hoặc cập nhật schema trong:
  - `src/schemas/jira.ts` (cho Jira)
  - `src/schemas/confluence.ts` (cho Confluence)
- Đảm bảo schema phản ánh đúng dữ liệu thực tế trả về/tạo ra từ Atlassian API.

### 7. Tạo và đăng ký tool
Với tools, cách đăng ký vẫn thống nhất:

```typescript
// Trong file tool (vd: src/tools/jira/your-tool.ts)
export function registerYourTool(server: any) {
  server.tool(
    'tool-name',  // Tên tool
    'Tool description', // Mô tả tool
    {
      // Schema input cho tool
      type: 'object',
      properties: {
        param1: { type: 'string', description: 'Parameter 1' },
        // ... các tham số khác
      },
      required: ['param1']
    },
    async (params: any, context: any) => {
      try {
        // Sử dụng context.atlassianConfig có sẵn
        const { atlassianConfig } = context;
        
        // Xử lý và gọi API
        const result = await yourToolFunction(atlassianConfig, params);
        
        // Trả về kết quả
        return {
          content: [
            { type: 'text', text: `Operation completed successfully: ${result}` }
          ]
        };
      } catch (error) {
        // Xử lý lỗi
        logger.error(`Error in tool handler:`, error);
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
```

Sau đó, đăng ký tool trong `src/tools/index.ts`:
```typescript
// Trong src/tools/index.ts
import { registerYourTool } from './jira/your-tool.js';

export function registerAllTools(server: any) {
  // Đăng ký các tool khác...
  registerYourTool(server);
}
```

### 8. Testing và debugging

#### Kiểm tra resource với test client
Sử dụng MCP test client từ đường dẫn `dev_mcp-atlassian-test-client`:

```bash
# Kiểm tra danh sách tất cả resource đã đăng ký
cd dev_mcp-atlassian-test-client
npx ts-node --esm src/list-mcp-inventory.ts

# Kiểm tra resource cụ thể
npx ts-node --esm src/test-your-resource.ts
```

#### Theo dõi logs
Khi debug, sử dụng các lệnh logging:
```typescript
import { Logger } from '../../utils/logger.js';
const logger = Logger.getLogger('YourResourceName');

// Trong code
logger.debug('Debug info', data);
logger.info('Operation completed');
logger.error('Error occurred', error);
```

### 9. Cập nhật tài liệu
- Sau khi thêm resource/tool mới, cập nhật lại tài liệu:
  - Bảng liệt kê resource/tool trong `docs/introduction/resources-and-tools.md`
  - Schema mô tả input/output nếu có thay đổi

### 10. Lưu ý quan trọng
- **Tên resource**: Đảm bảo mỗi resource có tên duy nhất khi đăng ký.
- **URI pattern**: Thiết kế URI pattern rõ ràng, nhất quán với các pattern khác.
- **List callback**: Đảm bảo list callback trả về chính xác URI pattern và mô tả.
- **Config**: Tự tạo hàm `getAtlassianConfigFromEnv()` trong mỗi file resource.
- **Error handling**: Bắt và xử lý lỗi phù hợp, trả về thông báo rõ ràng.
- **Schema**: Luôn định nghĩa và sử dụng schema để validate dữ liệu.
- **Testing**: Kiểm tra resource đã đăng ký đúng chưa bằng client test.

**Tóm tắt trình tự khi thêm mới:**
1. Xác định loại (resource/tool) và vị trí file.
2. Tạo file resource/tool mới với đúng cấu trúc.
3. Tạo hàm `getAtlassianConfigFromEnv()` trong mỗi file resource.
4. Đăng ký resource trực tiếp qua `server.resource()` hoặc tool qua `server.tool()`.
5. Định nghĩa/cập nhật schema.
6. Kiểm tra với client test để đảm bảo resource đã đăng ký thành công.
7. Cập nhật tài liệu.

Nếu tuân thủ đúng các bước trên, việc mở rộng MCP Atlassian Server sẽ luôn nhất quán, dễ bảo trì và dễ mở rộng về sau!