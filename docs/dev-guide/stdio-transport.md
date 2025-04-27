# Chi Tiết Về STDIO Transport - Tích Hợp Cline Với MCP Server

## Định Nghĩa Cốt Lõi

STDIO (Standard Input/Output) transport là phương thức giao tiếp giữa MCP Client và MCP Server thông qua các luồng đầu vào và đầu ra tiêu chuẩn của hệ điều hành. Đây là cơ chế truyền tải dữ liệu theo mô hình "process-to-process" - nghĩa là client khởi động server như một process con và trao đổi dữ liệu trực tiếp qua các luồng STDIO.

## Cách Triển Khai STDIO Transport Trong TypeScript SDK

Theo tài liệu chính thức về MCP, STDIO transport được triển khai như sau:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Khởi tạo MCP server với capabilities
const server = new McpServer({
  name: 'atlassian-integration',
  version: '1.0.0'
}, {
  capabilities: {
    resources: {},
    tools: {},
    prompts: {}
  }
});

// Khởi động server với STDIO transport
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => console.error('[INFO] MCP Server started with STDIO transport'))
  .catch(error => console.error('[ERROR] Failed to start server:', error));
```

## Cách Cline Kết Nối Với MCP Server

Cline, trong vai trò MCP Client, kết nối với MCP Server thông qua cấu hình trong file `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "atlassian-integration": {
      "command": "node",
      "args": ["/đường/dẫn/đầy/đủ/đến/dist/index.js"],
      "env": {
        "ATLASSIAN_SITE_NAME": "phuc-nt.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      },
      "transportType": "stdio"
    }
  }
}
```

Các thành phần quan trọng:
- `command` và `args`: Xác định cách khởi động MCP Server
- `env`: Biến môi trường được truyền vào process server
- `transportType`: Xác định loại transport (stdio)

## So Sánh Với Các Transport Khác

| Khía Cạnh | STDIO | HTTP/SSE | WebSockets |
|-----------|-------|----------|------------|
| **Mô hình kết nối** | Process-to-process | Client-server | Bidirectional |
| **Quy mô** | Single-user | Multi-user | Multi-user |
| **Cấu hình mạng** | Không cần | Yêu cầu port | Yêu cầu port |
| **Phù hợp với** | Local development | Cloud deployment | Real-time apps |
| **Giao thức** | JSON-RPC | HTTP, JSON-RPC | WebSocket, JSON-RPC |
| **Quản lý process** | Client quản lý | Độc lập | Độc lập |
| **Khả năng mở rộng** | Thấp | Cao | Cao |

## Ưu Điểm Của STDIO Transport

1. **Đơn Giản**: Không cần cấu hình mạng, firewall, hay port
2. **Hiệu Quả**: Giao tiếp trực tiếp qua luồng, giảm độ trễ
3. **An Toàn**: Không mở cổng mạng, giảm rủi ro bảo mật
4. **Phù Hợp Local**: Tối ưu cho MCP Server chạy trên máy local

## Hạn Chế Của STDIO Transport

1. **Không Hỗ Trợ Multi-user**: Chỉ một client kết nối được
2. **Khó Mở Rộng**: Không thích hợp cho triển khai cloud
3. **Quản Lý Process**: Client phải quản lý vòng đời process server
4. **Phụ Thuộc Hệ Điều Hành**: Hoạt động khác nhau trên các OS

## Best Practices Khi Phát Triển MCP Server Với STDIO

1. **Sử Dụng `console.error` Để Log**: Tránh dùng `console.log` vì STDIO dùng cho giao tiếp JSON-RPC
2. **Xử Lý Lỗi Nghiêm Túc**: Trả về lỗi có cấu trúc, tránh crash server
3. **Đăng Ký Resources và Tools Trước Khi Connect**: Đảm bảo thứ tự đúng
4. **Middleware Để Inject Context**: Đảm bảo biến môi trường được truyền vào context

## Quy Trình Kết Nối Đầy Đủ

1. Cline đọc cấu hình và khởi động MCP Server qua command
2. MCP Server khởi động và kết nối STDIO transport
3. Cline gửi yêu cầu MCP (ListTools, ListResources, etc.) qua STDIO
4. MCP Server xử lý yêu cầu theo capabilities (Tools, Resources, Prompts, Sampling)
5. Server trả về kết quả qua STDIO
6. Cline hiển thị kết quả trong giao diện người dùng

## Mối Liên Hệ Với Các Capabilities

STDIO transport là nền tảng truyền tải cho tất cả các capabilities của MCP:

- **Tools**: Các lệnh thực thi hành động được gửi qua STDIO từ Cline đến server
- **Resources**: Yêu cầu đọc dữ liệu được gửi qua STDIO và phản hồi trả về
- **Prompts**: Templates được truyền tải thông qua cùng một kênh STDIO
- **Sampling**: Yêu cầu LLM từ server đến client cũng sử dụng STDIO

STDIO transport là lớp truyền tải cơ bản nhất, tạo nền móng cho các capabilities khác hoạt động. Trong khi các capabilities xác định **loại tác vụ** (đọc dữ liệu, thực hiện hành động, tạo template, yêu cầu LLM), STDIO xác định **cách thức giao tiếp** giữa client và server.

## Ví Dụ Tương Tác Thực Tế

```
1. User mở VS Code và sử dụng Cline
2. Cline đọc cline_mcp_settings.json và khởi động MCP Server bằng command "node /path/to/index.js"
3. MCP Server khởi động và thiết lập STDIO transport
4. User yêu cầu "Lấy danh sách projects trong Jira"
5. Cline phân tích và gửi yêu cầu đến resource "jira://projects" qua STDIO
6. MCP Server nhận yêu cầu, xử lý và trả về danh sách projects qua STDIO
7. Cline hiển thị kết quả cho user
```

## Tương Lai Của Transport Trong MCP

Mặc dù STDIO là transport đơn giản và phổ biến nhất cho local development, các transport khác như HTTP/SSE đang dần được áp dụng rộng rãi hơn cho các triển khai quy mô lớn. Tuy nhiên, STDIO vẫn là lựa chọn tối ưu cho các use-cases cá nhân và phát triển, đặc biệt khi tích hợp với Cline trong VS Code. 