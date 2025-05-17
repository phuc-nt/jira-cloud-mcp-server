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

Khi muốn thêm mới **Resource** (truy vấn dữ liệu) hoặc **Tool** (thao tác/mutation) cho Jira hoặc Confluence, hãy làm theo các bước sau để đảm bảo codebase đồng nhất, dễ bảo trì, mở rộng và tương thích chuẩn MCP SDK:

### 1. Phân biệt Resource và Tool
- **Resource**: Trả về dữ liệu, chỉ đọc (GET), ví dụ: danh sách issue, chi tiết project, các comment, v.v.
- **Tool**: Thực hiện hành động/thao tác (POST/PUT/DELETE), ví dụ: tạo issue, cập nhật filter, thêm comment, v.v.

### 2. Vị trí file
- **Resource**: Thêm/cập nhật file trong:
  - `src/resources/jira/` (cho Jira)
  - `src/resources/confluence/` (cho Confluence)
  - Đăng ký resource mới trong file `index.ts` tương ứng nếu cần.
- **Tool**: Thêm/cập nhật file trong:
  - `src/tools/jira/` (cho Jira)
  - `src/tools/confluence/` (cho Confluence)
  - Đăng ký tool mới trong `src/tools/index.ts`.

### 3. Sử dụng helpers chuẩn hóa
- **Luôn sử dụng helpers mới:**
  - Import `Config` và `Resources` từ `../../utils/mcp-helpers.js`.
  - Không tự gọi fetch/axios trực tiếp trong resource/tool, mà phải dùng các hàm helper trong `src/utils/jira-resource-api.ts`, `src/utils/confluence-resource-api.ts` (resource) hoặc các file tool-api tương ứng.
- **Ví dụ import chuẩn:**
  ```typescript
  import { Config, Resources } from '../../utils/mcp-helpers.js';
  ```

### 4. Đăng ký resource theo chuẩn MCP
- Đăng ký resource qua `server.resource()` với `ResourceTemplate` và callback chuẩn hóa:
  ```typescript
  export function registerYourResource(server: McpServer) {
    server.resource(
      'unique-resource-name',
      new ResourceTemplate('resource://pattern/{param}', {
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
      async (uri, params, extra) => {
        // Ưu tiên lấy config từ context nếu có, fallback về env
        const config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
          ? (extra.context as any).atlassianConfig
          : Config.getAtlassianConfigFromEnv();
        // Xử lý params
        const param = Array.isArray(params.param) ? params.param[0] : params.param;
        // Gọi API helper
        const data = await yourApiFunction(config, param);
        // Chuẩn hóa response
        return Resources.createStandardResource(
          typeof uri === 'string' ? uri : uri.href,
          data.results || [], // hoặc data tuỳ API
          'resourceKey',      // ví dụ: 'issues', 'pages', ...
          yourSchema,
          data.size || (data.results || []).length,
          data.limit || (data.results || []).length,
          0,
          'uiUrl nếu có'
        );
      }
    );
  }
  ```
- **Lưu ý:**
  - Không trả về object tự do, luôn dùng `Resources.createStandardResource` để chuẩn hóa metadata, schema, paging, links.
  - Đảm bảo resource name (tên đầu tiên khi đăng ký) là duy nhất.
  - Không đăng ký trùng URI pattern ở nhiều file.

### 5. Chuẩn hóa schema dữ liệu
- Mỗi resource/tool **bắt buộc phải có schema** validate input/output.
- Thêm/cập nhật schema trong:
  - `src/schemas/jira.ts` (cho Jira)
  - `src/schemas/confluence.ts` (cho Confluence)
- Đảm bảo schema phản ánh đúng dữ liệu thực tế trả về/tạo ra từ Atlassian API.

### 6. Xử lý config và context an toàn
- Luôn ưu tiên lấy config từ context nếu có (khi gọi từ tool hoặc resource lồng nhau), fallback về env:
  ```typescript
  const config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
    ? (extra.context as any).atlassianConfig
    : Config.getAtlassianConfigFromEnv();
  ```
- Không hardcode credentials, không truyền config qua params.

### 7. Đăng ký tool theo chuẩn MCP
- Đăng ký tool qua `server.tool()` với schema input rõ ràng, callback chuẩn hóa:
  ```typescript
  export function registerYourTool(server: McpServer) {
    server.tool(
      'tool-name',
      'Tool description',
      {
        type: 'object',
        properties: { param1: { type: 'string' } },
        required: ['param1']
      },
      async (params, context) => {
        const { atlassianConfig } = context;
        const result = await yourToolFunction(atlassianConfig, params);
        return {
          content: [ { type: 'text', text: `Operation completed: ${result}` } ]
        };
      }
    );
  }
  ```
- Đăng ký tool trong `src/tools/index.ts` như resource.

### 7.1 Hướng dẫn chi tiết implement tool Jira (chuẩn mới)

Khi cần implement hoặc mở rộng tool Jira (thêm tool mới hoặc sửa tool hiện có), hãy làm theo hướng dẫn chi tiết sau:

#### Cấu trúc chung cho tool Jira
```typescript
// 1. Import helpers mới
import { z } from 'zod';
import { Config, Tools } from '../../utils/mcp-helpers.js';
import { McpResponse, createSuccessResponse, createErrorResponse } from '../../utils/mcp-core.js';
import { Logger } from '../../utils/logger.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// Sử dụng các API helper chuẩn hóa
import { createJiraIssueV3, updateJiraIssueV3 } from '../../utils/jira-tool-api-v3.js';
// hoặc helper API Agile (cho Sprint, Board...)
import { createSprint, updateSprint } from '../../utils/jira-tool-api-agile.js';

// 2. Logger chuẩn
const logger = Logger.getLogger('JiraTools:yourTool');

// 3. Schema input chuẩn hóa với Zod
export const yourToolSchema = z.object({
  param1: z.string().describe('Parameter 1 description'),
  param2: z.number().optional().describe('Optional parameter description'),
  // các tham số khác...
});

// 4. Type cho tham số và kết quả
type YourToolParams = z.infer<typeof yourToolSchema>;
interface YourToolResult {
  id: string;
  key?: string;
  success: boolean;
  message: string;
  // các trường kết quả khác...
}

// 5. Hàm handler chính (tách riêng xử lý logic)
export async function yourToolHandler(
  params: YourToolParams,
  config: any
): Promise<YourToolResult> {
  try {
    logger.info(`Starting yourTool with params: ${params.param1}`);
    
    // Gọi API Jira qua helper chuẩn hóa
    const result = await yourToolApiFunction(config, {
      // Map params sang API params
      param1: params.param1,
      param2: params.param2
    });
    
    // Xử lý kết quả, chuẩn hóa trả về
    return {
      id: result.id,
      key: result.key,
      success: true,
      message: `Operation completed successfully: ${result.id}`
    };
  } catch (error) {
    // Xử lý lỗi chuẩn
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error in yourTool:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Failed operation: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// 6. Hàm đăng ký tool
export const registerYourTool = (server: McpServer) => {
  server.tool(
    'yourTool',
    'Your tool description',
    yourToolSchema.shape,
    async (params: YourToolParams, context: Record<string, any>) => {
      try {
        // Lấy config từ context nếu có, fallback về env
        const config = context?.atlassianConfig ?? Config.getAtlassianConfigFromEnv();
        if (!config) {
          return {
            content: [
              { type: 'text', text: JSON.stringify({
                success: false,
                message: 'Invalid or missing Atlassian configuration'
              })}
            ],
            isError: true
          };
        }
        
        // Gọi handler
        const result = await yourToolHandler(params, config);
        
        // Trả về chuẩn JSON trong content[0].text
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                id: result.id,
                key: result.key,
                message: result.message
                // các trường khác...
              })
            }
          ]
        };
      } catch (error) {
        // Xử lý lỗi chuẩn
        if (error instanceof ApiError) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: error.message,
                  code: error.code,
                  statusCode: error.statusCode,
                  type: error.type
                })
              }
            ],
            isError: true
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `Error: ${error instanceof Error ? error.message : String(error)}`
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};
```

#### Ví dụ cụ thể: Tool createIssue
```typescript
// src/tools/jira/create-issue.ts
import { z } from 'zod';
import { Config } from '../../utils/mcp-helpers.js';
import { McpResponse, createErrorResponse } from '../../utils/mcp-core.js';
import { createJiraIssueV3 } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const logger = Logger.getLogger('JiraTools:createIssue');

// Schema chuẩn hóa
export const createIssueSchema = z.object({
  projectKey: z.string().describe('Jira project key (e.g. DEMO, TES, ...)'),
  summary: z.string().describe('Issue summary'),
  description: z.string().optional().describe('Issue description'),
  issueType: z.string().describe('Issue type (e.g. Task, Bug, Story, ...)'),
  priority: z.string().optional().describe('Issue priority (e.g. Highest, High, Medium, Low, Lowest)'),
  assignee: z.string().optional().describe('Assignee account ID')
});

// Main handler
export async function createIssueHandler(params, config) {
  try {
    logger.info(`Creating Jira issue in project: ${params.projectKey}`);
    const issueData = await createJiraIssueV3(config, {
      projectKey: params.projectKey,
      summary: params.summary,
      description: params.description || "",
      issueType: params.issueType,
      priority: params.priority,
      assignee: params.assignee
    });
    
    return {
      id: issueData.id,
      key: issueData.key,
      self: issueData.self,
      success: true
    };
  } catch (error) {
    logger.error(`Error creating Jira issue:`, error);
    throw error;
  }
}

// Đăng ký tool
export const registerCreateIssueTool = (server: McpServer) => {
  server.tool(
    'createIssue',
    'Create a new Jira issue',
    createIssueSchema.shape,
    async (params, context) => {
      try {
        const config = context?.atlassianConfig ?? Config.getAtlassianConfigFromEnv();
        const result = await createIssueHandler(params, config);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                id: result.id,
                key: result.key,
                self: result.self,
                success: true
              })
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : String(error)
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};
```

#### Lưu ý quan trọng khi implement tool Jira
- **Schema chuẩn**: Luôn định nghĩa schema input với Zod, bao gồm mô tả cho mỗi tham số.
- **Response chuẩn**: Trả về object `{ success: true/false, key/id, message, ... }` trong `content[0].text` (JSON string).
- **Error handling**: Xử lý mọi trường hợp lỗi, bao gồm lỗi invalid config, network errors, API errors.
- **Logging**: Sử dụng Logger chuẩn, không log thông tin nhạy cảm.
- **Helper API**: Sử dụng các helper API chuẩn hóa thay vì gọi trực tiếp fetch/axios:
  - `jira-tool-api-v3.js`: Cho các API REST Jira (issue, filter, dashboard, ...)
  - `jira-tool-api-agile.js`: Cho các API Agile (sprint, board, backlog, ...)
- **Không dùng các hàm cũ** từ `tool-helpers.js`, `mcp-response.js`.

### 8. Testing, debugging và backward compatibility
- Luôn test resource/tool mới bằng test client (`dev_mcp-atlassian-test-client`).
- Theo dõi log qua `Logger` để debug dễ dàng.
- Khi refactor, giữ backward compatibility cho client cũ (nếu cần), không đổi format response đột ngột.

### 9. Lưu ý bảo mật
- Không log credentials/API token ra log file.
- Không trả về thông tin nhạy cảm trong response.
- Chỉ expose các endpoint/resource thực sự cần thiết.

### 10. Cập nhật tài liệu
- Sau khi thêm resource/tool mới, cập nhật lại bảng liệt kê resource/tool và schema trong tài liệu này.
- Ghi chú rõ các thay đổi breaking change (nếu có).

---
**Tóm lại:**
- Luôn dùng helpers mới (`Config`, `Resources`), chuẩn hóa response, schema, context.
- Không lặp lại lỗi cũ (trùng resource, trả về object tự do, thiếu schema, hardcode config).
- Ưu tiên bảo mật, dễ mở rộng, dễ bảo trì, tương thích MCP SDK.