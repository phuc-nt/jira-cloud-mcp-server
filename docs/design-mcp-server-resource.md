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

## 4. Kế hoạch triển khai

### 4.1. Tạo cấu trúc thư mục

```
src/
├── resources/                    # Thư mục mới chứa tất cả resources
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

### 4.2. Tạo file utility cho MCP Resource

```typescript
// src/utils/mcp-resource.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from './logger.js';

const logger = Logger.getLogger('MCPResource');

// QUAN TRỌNG: Định dạng trả về đúng chuẩn MCP
export function createJsonResource(uri: string, data: any) {
  return {
    contents: [
      {
        uri: uri,
        mimeType: "application/json",
        text: JSON.stringify(data)
      }
    ]
  };
}

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

// Hàm đăng ký resource theo chuẩn MCP
export function registerResource(server: McpServer, uri: string, description: string, handler: Function) {
  logger.info(`Registering resource: ${uri}`);
  
  // Đăng ký resource trực tiếp với server
  server.resource(uri, description, async (uri, params, exchange) => {
    try {
      logger.info(`Handling resource request for: ${uri.href}`);
      logger.debug(`Resource params:`, params);
      
      // Đảm bảo context có atlassianConfig
      const config = exchange.context.atlassianConfig;
      if (!config) {
        logger.error(`Atlassian configuration not found in context for resource: ${uri.href}`);
        throw new Error('Atlassian configuration not found in context');
      }
      
      // Gọi handler với params và context
      const result = await handler(params, { config, uri: uri.href });
      logger.debug(`Resource result for ${uri.href}:`, result);
      
      return result;
    } catch (error) {
      logger.error(`Error in resource handler for ${uri.href}:`, error);
      throw error;
    }
  });
}
```

### 4.3. Triển khai resources cho Jira

#### 4.3.1. Tạo file index.ts cho Jira resources

```typescript
// src/resources/jira/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/server/schemas.js";
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

#### 4.3.2. Triển khai projects resources

```typescript
// src/resources/jira/projects.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiError } from '../../utils/error-handler.js';
import { callJiraApi } from '../../utils/atlassian-api.js';
import { createJsonResource, registerResource } from '../../utils/mcp-resource.js';
import { Logger } from '../../utils/logger.js';

const logger = Logger.getLogger('JiraResource:Projects');

export function registerProjectResources(server: McpServer) {
  // Resource: Danh sách projects
  registerResource(
    server,
    'jira://projects',
    'Lấy danh sách dự án trong Jira',
    async (params, { config, uri }) => {
      logger.info('Getting Jira projects');
      
      try {
        const projects = await callJiraApi(config, '/rest/api/2/project', 'GET');
        
        // Chuyển đổi response thành định dạng thân thiện
        const result = projects.map((project: any) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          projectType: project.projectTypeKey,
          url: `${config.baseUrl}/browse/${project.key}`
        }));
        
        // Trả về đúng định dạng MCP
        return createJsonResource(uri, result);
      } catch (error) {
        logger.error('Error getting Jira projects:', error);
        throw error;
      }
    }
  );
  
  // Resource: Thông tin chi tiết project
  registerResource(
    server,
    'jira://projects/:projectKey',
    'Lấy thông tin chi tiết về dự án trong Jira',
    async (params: { projectKey: string }, { config, uri }) => {
      logger.info(`Getting Jira project: ${params.projectKey}`);
      
      try {
        const project = await callJiraApi(config, `/rest/api/2/project/${params.projectKey}`, 'GET');
        
        // Chuyển đổi response thành định dạng thân thiện
        const result = {
          id: project.id,
          key: project.key,
          name: project.name,
          description: project.description,
          lead: project.lead?.displayName,
          url: `${config.baseUrl}/browse/${project.key}`,
          projectType: project.projectTypeKey
        };
        
        // Trả về đúng định dạng MCP
        return createJsonResource(uri, result);
      } catch (error) {
        logger.error(`Error getting Jira project ${params.projectKey}:`, error);
        throw error;
      }
    }
  );
}
```

### 4.4. Cập nhật file index.ts của dự án

```typescript
// src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerJiraTools } from './tools/jira/index.js';
import { registerConfluenceTools } from './tools/confluence/index.js';
import { registerAllResources } from './resources/index.js';
import { dotenvConfig } from './utils/dotenv-config.js';
import { Logger } from './utils/logger.js';

// Cấu hình và khởi tạo môi trường
dotenvConfig();
const logger = Logger.getLogger('MCPServer');

// Khởi tạo Atlassian config từ biến môi trường
const atlassianConfig = {
  baseUrl: `https://${process.env.ATLASSIAN_SITE_NAME}`,
  email: process.env.ATLASSIAN_USER_EMAIL,
  apiToken: process.env.ATLASSIAN_API_TOKEN
};

logger.info('[INFO][MCP:Server] Initializing MCP Atlassian Server...');
logger.info(`[INFO][MCP:Server] Connected to Atlassian site: ${process.env.ATLASSIAN_SITE_NAME}`);

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
server.connect(transport)
  .then(() => {
    logger.info('[INFO][MCP:Server] MCP Atlassian Server started successfully');
  })
  .catch(error => {
    logger.error('Failed to start MCP Server:', error);
    process.exit(1);
  });
```

## 5. Tránh lỗi "MCP error -32602: Resource not found"

Để tránh lỗi phổ biến "MCP error -32602: Resource not found", cần tuân thủ các nguyên tắc sau:

### 5.1. Khai báo capabilities

Luôn khai báo capabilities khi khởi tạo server:

```typescript
const server = new McpServer({
  name: 'mcp-atlassian-integration',
  version: '1.0.0'
}, {
  capabilities: {
    resources: {},  // Bắt buộc để hỗ trợ resources
    tools: {}
  }
});
```

### 5.2. Đăng ký ListResourcesRequest handler

Đảm bảo đăng ký handler cho ListResourcesRequest để Cline có thể discover resources:

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      { uri: "jira://projects", name: "Jira Projects", mimeType: "application/json" },
      // Liệt kê tất cả resources ở đây
    ]
  };
});
```

### 5.3. Đăng ký resource trực tiếp với server

Sử dụng phương thức `server.resource()` để đăng ký resource:

```typescript
server.resource(
  "jira://projects", 
  "Jira Projects", 
  async (uri, params, exchange) => {
    // Xử lý và trả về đúng định dạng
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(data)
        }
      ]
    };
  }
);
```

### 5.4. Định dạng trả về đúng chuẩn MCP

Đảm bảo định dạng trả về tuân thủ chuẩn MCP:

```typescript
return {
  contents: [
    {
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify(data)  // Phải chuyển thành text!
    }
  ]
};
```

### 5.5. Đăng ký resources trước khi connect

Đảm bảo đăng ký tất cả resources **trước khi** gọi `server.connect(transport)`.

### 5.6. Xử lý lỗi đúng cách

Bắt và xử lý lỗi trong handler, trả về thông báo lỗi có ý nghĩa.

## 6. Kiểm thử Resources

### 6.1. Sử dụng MCP Inspector

```bash
npx @modelcontextprotocol/inspector node ./dist/index.js
```

MCP Inspector sẽ mở giao diện web cho phép bạn:
- Xem danh sách resources đã đăng ký
- Thử gọi resources với các tham số khác nhau
- Xem kết quả trả về

### 6.2. Kiểm tra với Cline

1. Cấu hình Cline để kết nối với MCP server
2. Sử dụng câu lệnh như "Lấy danh sách các dự án Jira hiện có"
3. Kiểm tra xem Cline có thể truy cập resources hay không

### 6.3. Kiểm tra logs

Thêm logs chi tiết vào handlers để debug:

```typescript
logger.debug(`Handling resource request for: ${uri.href}`);
logger.debug(`Resource params:`, params);
logger.debug(`Resource result:`, result);
```

## 7. Tổng kết

Triển khai MCP Resources cho Atlassian API cho phép AI truy cập dữ liệu có cấu trúc từ Jira và Confluence. Bằng cách tuân thủ các nguyên tắc đăng ký và định dạng resource đúng chuẩn MCP, bạn có thể tránh lỗi "MCP error -32602: Resource not found" và tạo ra một MCP server hoạt động hiệu quả.

Các điểm quan trọng cần nhớ:
1. Khai báo capabilities khi khởi tạo server
2. Đăng ký ListResourcesRequest handler
3. Sử dụng `server.resource()` để đăng ký resource
4. Trả về định dạng đúng chuẩn MCP với property `contents`
5. Đăng ký resources trước khi connect
6. Xử lý lỗi đúng cách

Với những hướng dẫn này, bạn có thể triển khai thành công MCP Resources Capability cho Atlassian mà không gặp lỗi "Resource not found".