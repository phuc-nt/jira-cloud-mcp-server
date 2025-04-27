# Xây dựng MCP Server - Hướng dẫn cơ bản

Hướng dẫn này giúp bạn hiểu và xây dựng một Model Context Protocol (MCP) Server để kết nối trợ lý AI với Atlassian (Jira và Confluence) hoặc các dịch vụ khác.

## 1. MCP là gì?

Model Context Protocol (MCP) là một chuẩn mở cho phép các mô hình AI tương tác với dịch vụ bên ngoài mà không cần được huấn luyện trước về API cụ thể. MCP giải quyết vấn đề: **làm thế nào để AI sử dụng được các dịch vụ mà nó không được huấn luyện để tương tác**.

### Thành phần của MCP

1. **Host Application**: Ứng dụng mà người dùng tương tác trực tiếp (ví dụ: Cline)
2. **MCP Client**: Tích hợp trong Host, gửi yêu cầu đến server và nhận kết quả
3. **MCP Transport**: Lớp truyền dữ liệu (HTTP, WebSocket, STDIO)
4. **MCP Server**: Xử lý yêu cầu, gọi API bên ngoài, trả kết quả về Client

```
+----------------+         +----------------+         +----------------+
|                |         |                |         |                |
|    Host App    | <-----> |  MCP Transport | <-----> |   MCP Server   |
|  (with Client) |         |                |         |                |
+----------------+         +----------------+         +----------------+
                                                              |
                                                              v
                                                      +----------------+
                                                      |                |
                                                      | External APIs  |
                                                      | (Atlassian...) |
                                                      +----------------+
```

### Lợi ích của MCP

- **Tách biệt trách nhiệm**: AI tập trung vào xử lý ngôn ngữ, MCP Server tập trung vào tương tác với API
- **Mở rộng dễ dàng**: Thêm công cụ mới mà không cần huấn luyện lại mô hình
- **Bảo mật tốt hơn**: Kiểm soát được các hành động mà AI có thể thực hiện
- **Độc lập với mô hình**: Hoạt động với bất kỳ mô hình AI nào hỗ trợ gọi công cụ

## 2. Xây dựng MCP Server

### Cấu trúc thư mục

```
my-mcp-server/
├── src/
│   ├── index.ts                  # Entry point
│   ├── tools/                    # Tools (có side effects)
│   │   ├── jira/                 # Tools cho Jira
│   │   └── confluence/           # Tools cho Confluence
│   ├── resources/                # Resources (read-only)
│   │   ├── jira/                 # Resources cho Jira
│   │   └── confluence/           # Resources cho Confluence
│   └── utils/                    # Tiện ích
│       ├── atlassian-api.ts      # API client
│       └── logger.ts             # Logging
├── .env                          # Biến môi trường
└── package.json                  # Dependencies
```

### Luồng xử lý trong MCP

1. Người dùng đưa ra yêu cầu với AI
2. AI xác định cần gọi công cụ nào
3. MCP Client gửi yêu cầu đến MCP Server
4. MCP Server validate tham số, gọi API bên ngoài
5. API trả về kết quả cho MCP Server
6. MCP Server định dạng và gửi kết quả về Client
7. AI xử lý kết quả và trả lời người dùng

## 3. Các thành phần cốt lõi

### Server Initialization

```typescript
// index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Khởi tạo server với capabilities
const server = new McpServer({
  name: 'mcp-atlassian-server',
  version: '1.0.0',
  capabilities: {
    resources: {},  // Hỗ trợ resources
    tools: {}       // Hỗ trợ tools
  }
});

// Đăng ký tools và resources
registerTools(server);
registerResources(server);

// Khởi động với STDIO transport
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => console.log('MCP Server started'))
  .catch(error => console.error('Failed to start:', error));
```

### Cấu trúc Tool

Một công cụ trong MCP gồm 3 thành phần chính:

1. **Schema**: Định nghĩa và validate tham số đầu vào
2. **Handler**: Xử lý logic và gọi API
3. **Registration**: Đăng ký công cụ với MCP Server

```typescript
// tools/jira/create-issue.ts
import { z } from 'zod';

// 1. Schema
const createIssueSchema = z.object({
  projectKey: z.string().describe('Key của project'),
  summary: z.string().describe('Tiêu đề của issue'),
  description: z.string().optional().describe('Mô tả của issue'),
  issueType: z.string().default('Task').describe('Loại issue')
});

// 2. Handler
async function createIssueHandler(params, context) {
  try {
    const { projectKey, summary, description, issueType } = params;
    const config = (context as any).atlassianConfig;
    
    // Gọi Jira API
    const result = await callJiraApi(
      config,
      '/rest/api/3/issue',
      'POST',
      {
        fields: {
          project: { key: projectKey },
          summary,
          description: createADF(description),
          issuetype: { name: issueType }
        }
      }
    );
    
    // Trả về kết quả thành công
    return {
      content: [
        { type: 'text', text: `Issue created successfully: ${result.key}` }
      ],
      data: result
    };
  } catch (error) {
    // Trả về lỗi
    return {
      content: [
        { type: 'text', text: `Error creating issue: ${error.message}` }
      ],
      isError: true
    };
  }
}

// 3. Registration
export function registerCreateIssueTool(server) {
  server.tool(
    'createIssue',
    'Tạo issue mới trong Jira',
    createIssueSchema,
    createIssueHandler
  );
}
```

### Cấu trúc Resource

Resources là tài nguyên chỉ đọc (read-only), được định nghĩa với URI pattern:

```typescript
// resources/jira/issues.ts
import { ResourceHandler } from '@modelcontextprotocol/sdk/server/resource.js';

// Handler cho resource jira://issues
const issuesResourceHandler: ResourceHandler = {
  get: async ({ uri, params }, context) => {
    const config = (context as any).atlassianConfig;
    
    // Xử lý URI jira://issues
    if (uri === 'jira://issues') {
      // Lấy danh sách issues (có thể có params như jql)
      const jql = params.get('jql') || '';
      const result = await searchIssues(config, jql);
      
      return {
        data: result.issues,
        contentType: 'application/json'
      };
    }
    
    // Xử lý URI jira://issues/{issueKey}
    const issueKeyMatch = uri.match(/^jira:\/\/issues\/([A-Z0-9]+-[0-9]+)$/);
    if (issueKeyMatch) {
      const issueKey = issueKeyMatch[1];
      const issue = await getIssue(config, issueKey);
      
      return {
        data: issue,
        contentType: 'application/json'
      };
    }
    
    return null; // Không hỗ trợ URI này
  }
};

// Đăng ký resource handler
export function registerJiraIssuesResource(server) {
  server.registerResourceHandler('jira://issues', issuesResourceHandler);
  server.registerResourceHandler('jira://issues/*', issuesResourceHandler);
}
```

## 4. Các loại Tool và Resource

### Tools cho Jira

| Tên Tool | Mục đích | Tham số chính |
|----------|----------|---------------|
| `createIssue` | Tạo issue mới | `projectKey`, `summary`, `description` |
| `updateIssue` | Cập nhật issue | `issueIdOrKey`, `fields` |
| `transitionIssue` | Chuyển trạng thái | `issueIdOrKey`, `transitionId` |
| `assignIssue` | Gán issue | `issueIdOrKey`, `accountId` |

### Resources cho Jira

| URI Pattern | Mô tả |
|-------------|-------|
| `jira://projects` | Danh sách projects |
| `jira://projects/{projectKey}` | Chi tiết project |
| `jira://issues` | Danh sách issues |
| `jira://issues?jql={query}` | Tìm kiếm issues bằng JQL |
| `jira://issues/{issueKey}` | Chi tiết issue |
| `jira://users` | Danh sách users |

### Tools cho Confluence

| Tên Tool | Mục đích | Tham số chính |
|----------|----------|---------------|
| `createPage` | Tạo trang mới | `spaceKey`, `title`, `content` |
| `updatePage` | Cập nhật trang | `pageId`, `title`, `content`, `version` |
| `addComment` | Thêm comment | `pageId`, `content` |

### Resources cho Confluence

| URI Pattern | Mô tả |
|-------------|-------|
| `confluence://spaces` | Danh sách spaces |
| `confluence://spaces/{spaceKey}` | Chi tiết space |
| `confluence://pages` | Danh sách trang |
| `confluence://pages?cql={query}` | Tìm kiếm trang bằng CQL |
| `confluence://pages/{pageId}` | Chi tiết trang |

## 5. Kết nối với Cline

### Triển khai với Docker (khuyến nghị)

1. **Chuẩn bị môi trường**:
   - Tạo file `.env` chứa thông tin xác thực Atlassian
   - Build code TypeScript: `npm run build`

2. **Chạy Docker**:
   ```bash
   ./start-docker.sh
   # Chọn "Chạy MCP Server"
   ```

3. **Cấu hình Cline**:
   Thêm vào file `cline_mcp_settings.json`:
   ```json
   {
     "mcpServers": {
       "atlassian-docker-stdio": {
         "command": "docker",
         "args": ["exec", "-i", "mcp-atlassian", "node", "dist/index.js"],
         "env": {},
         "transportType": "stdio"
       }
     }
   }
   ```

### Vấn đề thường gặp và cách giải quyết

1. **Lỗi xác thực**:
   - Kiểm tra API token trong file `.env`
   - Đảm bảo email và domain Atlassian đúng

2. **Lỗi kết nối**:
   - Kiểm tra container Docker đang chạy
   - Xem logs: `docker logs mcp-atlassian`

3. **Không tìm thấy công cụ**:
   - Kiểm tra công cụ đã được đăng ký đúng cách
   - Xác nhận MCP Server khởi động thành công

## 6. Best Practices

### Xử lý API

- Thêm `User-Agent` header khi gọi Atlassian API
- Xử lý ADF (Atlassian Document Format) cẩn thận
- Validate input trước khi gửi request

### Error Handling

- Phân loại lỗi theo loại (API, Authentication, Validation, Network)
- Trả về thông báo lỗi rõ ràng và hướng dẫn khắc phục
- Implement retry logic cho lỗi tạm thời

### Performance

- Sử dụng caching cho các resource phổ biến
- Thêm timeout hợp lý cho các API calls
- Tối ưu payload khi gọi API

## 7. Roadmap phát triển

1. **Cải thiện Local Experience**:
   - Thêm caching để giảm số lượng API calls
   - Hỗ trợ debug và logging tốt hơn

2. **Mở rộng Resources**:
   - Thêm support cho Boards, Filters, Dashboards
   - Hỗ trợ thêm tham số query và filter

3. **Cải thiện UX với Cline**:
   - Format markdown tốt hơn trong phản hồi
   - Thêm ví dụ về MCP Rules và Prompts

4. **Chia sẻ kiến thức**:
   - Đóng góp cho cộng đồng MCP
   - Xây dựng hướng dẫn và seminar

## Tài liệu tham khảo

- [MCP Protocol Specification](https://github.com/anthropics/anthropic-cookbook/tree/main/mcp)
- [Cline Documentation](https://github.com/cline-ai/cline)
- [Atlassian REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/) 