# Thiết kế và Triển khai MCP Resources Capability cho Atlassian

Tài liệu này mô tả kế hoạch và thiết kế để triển khai MCP Resources Capability cho MCP Atlassian Server, nhằm bổ sung khả năng cung cấp dữ liệu có cấu trúc từ Atlassian (Jira và Confluence) theo chuẩn MCP, đồng thời tránh lỗi "MCP error -32602: Resource not found".

## 1. Phân tích sự khác biệt giữa Resources và Tools

| Resources | Tools |
|-----------|-------|
| Chỉ đọc dữ liệu (READ) | Thực hiện thay đổi (CREATE/UPDATE/DELETE) |
| Không gây tác dụng phụ | Có thể thay đổi trạng thái hệ thống |
| Tương tự GET endpoints | Tương tự POST/PUT/DELETE endpoints |
| Do ứng dụng kiểm soát | Do mô hình AI kiểm soát |
| Ví dụ: `jira://projects` | Ví dụ: `createIssue` |

Theo định nghĩa trong MCP:
- **Resources**: Cung cấp dữ liệu có cấu trúc, không gây tác dụng phụ, hoạt động tương tự endpoints GET trong REST API.
- **Tools**: Thực hiện các hành động, thay đổi trạng thái hệ thống, tương tự function calling.

## 2. Phân loại API Atlassian

### 2.1. API Jira

#### Nên là Resources:
1. **Lấy thông tin Issue** (hiện là tool `getIssue`) 
   - URI: `jira://issues/ISSUE-KEY`
   - Lý do: Chỉ đọc dữ liệu, không thay đổi trạng thái
   - API: GET `/rest/api/2/issue/{issueIdOrKey}`

2. **Tìm kiếm Issues** (hiện là tool `searchIssues`)
   - URI: `jira://issues?jql=PROJECT=XYZ`
   - Lý do: Chỉ đọc và tìm kiếm dữ liệu
   - API: GET `/rest/api/2/search`

3. **Danh sách Projects**
   - URI: `jira://projects`
   - Lý do: Cung cấp danh sách các dự án, chỉ đọc
   - API: GET `/rest/api/2/project`

4. **Thông tin chi tiết Project** 
   - URI: `jira://projects/PROJECT-KEY`
   - Lý do: Cung cấp thông tin về một dự án cụ thể
   - API: GET `/rest/api/2/project/{projectIdOrKey}`

5. **Lấy trạng thái có thể chuyển đổi của Issue**
   - URI: `jira://issues/ISSUE-KEY/transitions`
   - Lý do: Cung cấp danh sách các trạng thái có thể chuyển đổi
   - API: GET `/rest/api/2/issue/{issueIdOrKey}/transitions`

#### Nên là Tools:
1. **Tạo Issue** (`createIssue`)
   - Lý do: Tạo mới dữ liệu, thay đổi trạng thái hệ thống
   - API: POST `/rest/api/2/issue`

2. **Cập nhật Issue** (`updateIssue`)
   - Lý do: Sửa đổi dữ liệu hiện có
   - API: PUT `/rest/api/2/issue/{issueIdOrKey}`

3. **Chuyển trạng thái Issue** (`transitionIssue`)
   - Lý do: Thay đổi trạng thái của issue
   - API: POST `/rest/api/2/issue/{issueIdOrKey}/transitions`

4. **Gán Issue** (`assignIssue`)
   - Lý do: Thay đổi người được gán cho issue
   - API: PUT `/rest/api/2/issue/{issueIdOrKey}/assignee`

5. **Log Work**
   - Lý do: Thêm thông tin về thời gian làm việc trên issue
   - API: POST `/rest/api/2/issue/{issueIdOrKey}/worklog`

### 2.2. API Confluence

#### Nên là Resources:
1. **Lấy thông tin trang** (hiện là tool `getPage`)
   - URI: `confluence://pages/PAGE-ID`
   - Lý do: Chỉ đọc dữ liệu, không thay đổi trạng thái
   - API: GET `/rest/api/content/{id}`

2. **Tìm kiếm trang** (hiện là tool `searchPages`)
   - URI: `confluence://pages?cql=space=SPACE-KEY AND title~"Daily Report"`
   - Lý do: Chỉ đọc và tìm kiếm dữ liệu
   - API: GET `/rest/api/content/search`

3. **Danh sách không gian** (hiện là tool `getSpaces`)
   - URI: `confluence://spaces`
   - Lý do: Cung cấp danh sách không gian, chỉ đọc
   - API: GET `/rest/api/space`

4. **Thông tin chi tiết không gian**
   - URI: `confluence://spaces/SPACE-KEY`
   - Lý do: Cung cấp thông tin về một không gian cụ thể
   - API: GET `/rest/api/space/{spaceKey}`

5. **Lấy danh sách bình luận của trang**
   - URI: `confluence://pages/PAGE-ID/comments`
   - Lý do: Cung cấp danh sách bình luận
   - API: GET `/rest/api/content/{id}/child/comment`

#### Nên là Tools:
1. **Tạo trang** (`createPage`)
   - Lý do: Tạo mới dữ liệu, thay đổi trạng thái hệ thống
   - API: POST `/rest/api/content`

2. **Cập nhật trang** (`updatePage`)
   - Lý do: Sửa đổi dữ liệu hiện có
   - API: PUT `/rest/api/content/{id}`

3. **Thêm bình luận** (`addComment`)
   - Lý do: Thay đổi dữ liệu bằng cách thêm bình luận
   - API: POST `/rest/api/content/{id}/child/comment`

## 3. Thiết kế cấu trúc Resource URI

Thiết kế URI (Uniform Resource Identifier) nhất quán cho Resources:

### 3.1. Jira Resources URI

```
jira://projects                    # Danh sách dự án
jira://projects/{projectKey}       # Thông tin dự án cụ thể
jira://projects/{projectKey}/issues # Issues của một dự án
jira://issues                      # Danh sách tất cả các issue (với pagination)
jira://issues?jql={query}          # Tìm kiếm issue theo JQL
jira://issues/{issueKey}           # Thông tin chi tiết về issue
jira://issues/{issueKey}/transitions # Các trạng thái có thể chuyển đổi
jira://issues/{issueKey}/comments  # Bình luận của issue
jira://users                       # Danh sách người dùng
jira://users/{accountId}           # Thông tin người dùng cụ thể
```

### 3.2. Confluence Resources URI

```
confluence://spaces                # Danh sách không gian
confluence://spaces/{spaceKey}     # Thông tin không gian cụ thể
confluence://spaces/{spaceKey}/pages # Trang trong một không gian
confluence://pages                 # Danh sách tất cả các trang (với pagination)
confluence://pages?cql={query}     # Tìm kiếm trang theo CQL
confluence://pages/{pageId}        # Thông tin chi tiết về trang
confluence://pages/{pageId}/children # Trang con của một trang
confluence://pages/{pageId}/comments # Bình luận của trang
```

## 4. Hướng dẫn implement MCP Resource

### 4.1. Chuẩn hóa dùng ResourceTemplate

**Nguyên tắc quan trọng**: Luôn dùng `ResourceTemplate` cho mọi resource dù có hay không có parameter.

#### 4.1.1. Resource KHÔNG có parameter (static URI)

```typescript
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createJsonResource } from '../../utils/mcp-resource.js';

export function registerProjectResources(server: McpServer) {
  server.resource(
    'jira-projects-list',
    new ResourceTemplate('jira://projects', { list: undefined }),
    async (uri, _params, extra) => {
      // Lấy danh sách dự án từ Jira API
      // ...
      return createJsonResource(uri.href, {
        projects: formattedProjects,
        count: formattedProjects.length,
        message: `Tìm thấy ${formattedProjects.length} dự án`
      });
    }
  );
}
```

#### 4.1.2. Resource CÓ parameter (dynamic URI)

```typescript
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createJsonResource } from '../../utils/mcp-resource.js';

export function registerIssueResources(server: McpServer) {
  server.resource(
    'jira-issue-details',
    new ResourceTemplate('jira://issues/{issueKey}', { list: undefined }),
    async (uri, { issueKey }, extra) => {
      // Đảm bảo issueKey là string
      const normalizedIssueKey = Array.isArray(issueKey) ? issueKey[0] : issueKey;
      // Lấy thông tin issue từ Jira API
      // ...
      return createJsonResource(uri.href, {
        issue: formattedIssue,
        message: `Thông tin chi tiết issue ${normalizedIssueKey}`
      });
    }
  );
}
```

#### 4.1.3. Lưu ý khi dùng ResourceTemplate

- **Tham số trong URI**: Bất kỳ phần nào nằm trong `{}` sẽ được MCP SDK tự động parse và truyền vào handler.
- **Chuẩn hóa tham số**: Tham số có thể là string hoặc string[], nên luôn chuẩn hóa:
  ```typescript
  const normalizedParam = Array.isArray(param) ? param[0] : param;
  ```
- **Handler nhận 3 tham số**: `(uri, params, extra)`
- **Lý do dùng ResourceTemplate cho mọi resource**:
  - Codebase thống nhất, dễ bảo trì
  - Dễ dàng mở rộng với tham số trong tương lai
  - Không ảnh hưởng đến hoạt động của MCP SDK

### 4.2. Định dạng trả về đúng chuẩn MCP

Đảm bảo mọi resource trả về đúng định dạng theo chuẩn MCP:

```typescript
// Tạo resource JSON
export function createJsonResource(uri: string, data: any) {
  return {
    contents: [
      {
        uri: uri,
        mimeType: "application/json",
        text: JSON.stringify(data)  // Bắt buộc phải chuyển thành text!
      }
    ]
  };
}

// Tạo resource Text
export function createTextResource(uri: string, data: string) {
  return {
    contents: [
      {
        uri: uri,
        mimeType: "text/plain",
        text: data
      }
    ]
  };
}
```

### 4.3. Sử dụng utility function để đăng ký

Nên sử dụng hàm utility `registerResource` để đăng ký resource:

```typescript
// src/utils/mcp-resource.ts
export function registerResource(
  server: McpServer, 
  resourceName: string,
  resourceUri: string | any, // Có thể truyền ResourceTemplate
  description: string, 
  handler: ResourceHandlerFunction
) {
  logger.info(`Registering resource: ${resourceName} (${resourceUri instanceof Object && 'pattern' in resourceUri ? resourceUri.pattern : resourceUri})`);
  
  // Đăng ký resource với MCP Server
  server.resource(resourceName, resourceUri, 
    async (uri, extra) => {
      try {
        // Xử lý context, params và gọi handler cùng config
        // ...
      } catch (error) {
        // Xử lý lỗi
      }
    }
  );
}
```

## 5. Cấu trúc thư mục và triển khai

### 5.1. Cấu trúc thư mục

```
src/
├── resources/                    # Thư mục chứa tất cả resources
│   ├── jira/                     # Resources cho Jira
│   │   ├── index.ts              # Đăng ký tất cả Jira resources
│   │   ├── issues.ts             # Định nghĩa resources cho issues
│   │   ├── projects.ts           # Định nghĩa resources cho projects
│   │   └── users.ts              # Định nghĩa resources cho users
│   ├── confluence/               # Resources cho Confluence
│   │   ├── index.ts              # Đăng ký tất cả Confluence resources
│   │   ├── spaces.ts             # Định nghĩa resources cho spaces
│   │   └── pages.ts              # Định nghĩa resources cho pages
│   └── index.ts                  # Đăng ký tất cả resources
└── utils/
    └── mcp-resource.ts           # Utility functions cho resources
```

### 5.2. Triển khai resources cho Jira

#### 5.2.1. Tạo file index.ts cho Jira resources

```typescript
// src/resources/jira/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListResourcesRequestSchema } from "@modelcontextprotocol/sdk/server/schemas.js";
import { registerIssueResources } from './issues.js';
import { registerProjectResources } from './projects.js';
import { registerUserResources } from './users.js';
import { Logger } from '../../utils/logger.js';

const logger = Logger.getLogger('JiraResources');

export function registerJiraResources(server: McpServer) {
  logger.info('Registering Jira resources...');
  
  // Đăng ký handler cho ListResourcesRequest
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.info('Handling ListResourcesRequest');
    return {
      resources: [
        { uri: "jira://projects", name: "Jira Projects", mimeType: "application/json" },
        { uri: "jira://issues", name: "Jira Issues", mimeType: "application/json" },
        { uri: "jira://issues/{issueKey}", name: "Jira Issue Details", mimeType: "application/json" },
        { uri: "jira://projects/{projectKey}", name: "Jira Project Details", mimeType: "application/json" },
        { uri: "jira://users", name: "Jira Users", mimeType: "application/json" },
        { uri: "jira://users/{accountId}", name: "Jira User Details", mimeType: "application/json" }
      ]
    };
  });
  
  // Đăng ký các resources cụ thể
  registerIssueResources(server);
  registerProjectResources(server);
  registerUserResources(server);
  
  logger.info('Jira resources registered successfully');
}
```

### 5.3. Cập nhật file index.ts của dự án

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllResources } from './resources/index.js';
import { registerJiraTools } from './tools/jira/index.js';
import { registerConfluenceTools } from './tools/confluence/index.js';
import { Logger } from './utils/logger.js';

// QUAN TRỌNG: Khởi tạo server với khai báo capabilities
const server = new McpServer({
  name: 'mcp-atlassian-integration',
  version: '1.0.0'
}, {
  capabilities: {
    resources: {},  // Khai báo rõ ràng resources capability
    tools: {}
  }
});

// Đăng ký context cho server
server.use((exchange, next) => {
  exchange.context.atlassianConfig = atlassianConfig;
  return next();
});

// Đăng ký resources TRƯỚC khi đăng ký tools và TRƯỚC khi connect
registerAllResources(server);

// Đăng ký tools
registerJiraTools(server);
registerConfluenceTools(server);

// Khởi động server
const transport = new StdioServerTransport();
server.connect(transport);
```

## 6. Tránh lỗi "MCP error -32602: Resource not found"

### 6.1. Checklist để tránh lỗi

1. **Khai báo capabilities**: Luôn khai báo `capabilities: { resources: {} }` khi khởi tạo server
2. **Đăng ký ListResourcesRequest**: Cài đặt handler để liệt kê tất cả resources có thể truy cập
3. **Định dạng trả về đúng chuẩn**: Đảm bảo đúng cấu trúc `{ contents: [{ uri, mimeType, text }] }`
4. **Đăng ký resource trước khi connect**: Thứ tự đúng là: `registerResources()` → `server.connect()`
5. **Xử lý lỗi đúng cách**: Bắt và xử lý lỗi trong handler, không để crash server

## 7. Kiểm thử Resources

### 7.1. Sử dụng MCP Inspector

```bash
npx @modelcontextprotocol/inspector node ./dist/index.js
```

### 7.2. Kiểm tra với Cline

1. Cấu hình Cline để kết nối với MCP server
2. Sử dụng câu lệnh tự nhiên như "Lấy danh sách các dự án Jira hiện có"
3. Kiểm tra xem Cline có thể truy cập resources hay không

### 7.3. Thiết lập logs chi tiết

```typescript
logger.debug(`Handling resource request for: ${uri.href}`);
logger.debug(`Resource params:`, params);
logger.debug(`Resource result:`, result);
```

## 8. Tổng kết

Các điểm quan trọng khi triển khai MCP Resources Capability:

1. **Luôn dùng ResourceTemplate**: Dù có hay không có parameter
2. **Chuẩn hóa tham số**: `const normalized = Array.isArray(param) ? param[0] : param;`
3. **Định dạng response đúng chuẩn**: Dùng `createJsonResource` hoặc `createTextResource`
4. **Khai báo capabilities**: Luôn thêm `capabilities: { resources: {} }`
5. **Thứ tự đăng ký**: Resources → Tools → Connect
6. **Xử lý lỗi đúng cách**: Không để crash server

Với những nguyên tắc và hướng dẫn này, bạn có thể triển khai thành công MCP Resources Capability cho Atlassian một cách hiệu quả, đúng chuẩn, và dễ bảo trì.

## Danh sách Resources và Tools

### Jira Resources
| URI | Mô tả | Lý do |
| --- | ----- | ----- |
| `jira://projects` | Danh sách project | Đã triển khai - Trả về danh sách project với thông tin tổng hợp |
| `jira://projects/:projectKey` | Chi tiết project | Đã triển khai - Trả về thông tin chi tiết của một project cụ thể |
| `jira://issues/:issueKey` | Chi tiết issue | Đã triển khai - Trả về thông tin chi tiết của một issue với xử lý lỗi | 
| `jira://issues?jql={query}` | Tìm kiếm issue theo JQL | Sẽ chuyển đổi từ tool `searchIssues` - Cần chuyển đổi từ tool để đồng bộ với mô hình Resource |
| `jira://issues` | Danh sách issue | Đang triển khai - Sẽ trả về danh sách issue với phân trang |
| `jira://issues/:issueKey/transitions` | Các trạng thái có thể chuyển đổi | Sẽ triển khai - Trả về danh sách các transition có thể thực hiện |
| `jira://issues/:issueKey/comments` | Bình luận của issue | Sẽ triển khai - Trả về danh sách comments của issue cụ thể |
| `jira://users` | Danh sách user | Sẽ triển khai - Trả về danh sách người dùng với thông tin cơ bản |
| `jira://users/:accountId` | Chi tiết user | Sẽ triển khai - Trả về thông tin chi tiết của một người dùng |

### Confluence Resources
| URI | Mô tả | Lý do |
| --- | ----- | ----- |
| `confluence://spaces` | Danh sách không gian | Sẽ chuyển đổi từ tool `getSpaces` - Cần chuyển đổi để đồng bộ với mô hình Resource |
| `confluence://spaces/:spaceKey` | Chi tiết không gian | Sẽ triển khai - Trả về thông tin chi tiết của một không gian |
| `confluence://spaces/:spaceKey/pages` | Danh sách trang trong không gian | Sẽ triển khai - Trả về danh sách trang trong một không gian cụ thể |
| `confluence://pages/:pageId` | Chi tiết trang | Sẽ chuyển đổi từ tool `getPage` - Cần chuyển đổi để đồng bộ với mô hình Resource |
| `confluence://pages?cql={query}` | Tìm kiếm trang theo CQL | Sẽ chuyển đổi từ tool `searchPages` - Cần chuyển đổi để đồng bộ với mô hình Resource |
| `confluence://pages/:pageId/children` | Danh sách trang con | Sẽ triển khai - Trả về danh sách trang con của một trang cụ thể |
| `confluence://pages/:pageId/comments` | Bình luận của trang | Sẽ triển khai - Trả về danh sách bình luận của một trang |

### Jira Tools
| URI | Mô tả | Lý do |
| --- | ----- | ----- |
| `createIssue` | Tạo issue mới | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `updateIssue` | Cập nhật issue | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `deleteIssue` | Xóa issue | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `transitionIssue` | Chuyển đổi trạng thái issue | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `addComment` | Thêm bình luận | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `updateComment` | Cập nhật bình luận | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `deleteComment` | Xóa bình luận | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `assignIssue` | Gán issue cho người dùng | API gây tác dụng phụ, thay đổi trạng thái hệ thống |

### Confluence Tools
| URI | Mô tả | Lý do |
| --- | ----- | ----- |
| `createPage` | Tạo trang mới | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `updatePage` | Cập nhật trang | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `deletePage` | Xóa trang | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `addComment` | Thêm bình luận | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `updateComment` | Cập nhật bình luận | API gây tác dụng phụ, thay đổi trạng thái hệ thống |
| `deleteComment` | Xóa bình luận | API gây tác dụng phụ, thay đổi trạng thái hệ thống |

## Kế hoạch triển khai

### Đã hoàn thành
1. **Đăng ký MCP Resources Capability**
   - Cập nhật server để hỗ trợ resources capability
   - Tạo cấu trúc mã cơ bản cho resources
   - Tạo hàm xử lý cho việc đăng ký resource
   - Cải thiện xử lý context với fallback cho `atlassianConfig`

2. **Resource API cơ bản cho Jira**
   - Triển khai `jira://projects` trả về danh sách dự án với thông tin tổng hợp
   - Triển khai `jira://projects/:projectKey` trả về chi tiết dự án với hỗ trợ trích xuất từ URI
   - Triển khai `jira://issues/:issueKey` trả về chi tiết issue với xử lý lỗi
   - Tối ưu định dạng trả về dữ liệu để phù hợp với mục đích AI

### Đang triển khai
1. **Triển khai Jira Issues API**
   - Resource `jira://issues` để liệt kê tất cả issues với phân trang
   - Thêm hỗ trợ tìm kiếm issues theo điều kiện khác nhau
   - Hoàn thiện xử lý lỗi và kiểm tra tham số
   - Tối ưu cấu trúc trả về cho mục đích AI

2. **Chuyển đổi các tools thành resources**
   - Tool `searchIssues` -> Resource `jira://issues?jql={query}`
   - Tool `getPage` -> Resource `confluence://pages/{pageId}`
   - Tool `searchPages` -> Resource `confluence://pages?cql={query}`
   - Tool `getSpaces` -> Resource `confluence://spaces`

### Sẽ triển khai
1. **Triển khai Jira Resources bổ sung**
   - Resource `jira://issues/:issueKey/transitions` cho danh sách transitions
   - Resource `jira://issues/:issueKey/comments` cho danh sách comments
   - Resource `jira://users` cho danh sách người dùng
   - Resource `jira://users/:accountId` cho chi tiết người dùng

2. **Triển khai Confluence Resources**
   - Resource `confluence://spaces/:spaceKey` cho chi tiết không gian
   - Resource `confluence://spaces/:spaceKey/pages` cho danh sách trang trong không gian
   - Resource `confluence://pages/:pageId/children` cho danh sách trang con
   - Resource `confluence://pages/:pageId/comments` cho danh sách bình luận