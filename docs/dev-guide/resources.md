# Chi Tiết Về Resources - Truy Cập Dữ Liệu Có Cấu Trúc

## Định Nghĩa Cốt Lõi

Resources trong MCP là các endpoints chỉ đọc (read-only) cho phép truy cập dữ liệu có cấu trúc mà không gây tác dụng phụ. Resources hoạt động theo nguyên tắc "application-controlled" - tức là ứng dụng (không phải AI) kiểm soát việc cung cấp dữ liệu.

## Cách Triển Khai Với TypeScript SDK

Theo tài liệu chính thức từ repository ModelContextProtocol TypeScript SDK, có hai loại Resources:

### 1. Static Resources (không có parameters)

```typescript
server.resource(
  "projects", 
  "jira://projects", 
  async (uri) => ({
    contents: [{ 
      uri: uri.href, 
      mimeType: "application/json",
      text: JSON.stringify(projectsData) 
    }]
  })
);
```

### 2. Dynamic Resources (với parameters)

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

server.resource(
  "issue-details",
  new ResourceTemplate("jira://issues/{issueKey}", { list: undefined }),
  async (uri, { issueKey }) => ({
    contents: [{ 
      uri: uri.href, 
      mimeType: "application/json",
      text: JSON.stringify(issueData) 
    }]
  })
);
```

## Use Cases Với Atlassian

Tích hợp Resources với Jira:
- **Danh sách projects** (jira://projects)
- **Chi tiết project** (jira://projects/{projectKey})
- **Danh sách issues** (jira://issues)
- **Chi tiết issue** (jira://issues/{issueKey})
- **Danh sách transitions** (jira://issues/{issueKey}/transitions)

Tích hợp Resources với Confluence:
- **Danh sách spaces** (confluence://spaces)
- **Chi tiết space** (confluence://spaces/{spaceKey})
- **Danh sách pages** (confluence://pages)
- **Chi tiết page** (confluence://pages/{pageId})

## So Sánh Với Tools & Prompts

| Khía Cạnh | Resources | Tools | Prompts |
|-----------|-----------|-------|---------|
| **Mô hình kiểm soát** | Application-controlled | Model-controlled | Template-oriented |
| **Hoạt động chính** | READ | CREATE/UPDATE/DELETE | FORMAT/TEMPLATE |
| **Tác dụng phụ** | Không | Có | Không |
| **Cần xác nhận người dùng** | Thường không cần | Thường cần | Không cần |
| **Tương tự REST** | GET | POST/PUT/DELETE | N/A |
| **Kiểu dữ liệu trả về** | `{ contents: [...] }` | `{ content: [...] }` | `{ messages: [...] }` |
| **Định nghĩa parameters** | ResourceTemplate | Zod schema | Zod schema |

## Ưu Điểm Của Resources

1. **Hiệu Suất Cao**: Tối ưu cho truy vấn dữ liệu đơn giản, không cần xác nhận
2. **Tương Thích Với AI's RAG Framework**: Hoạt động tốt với các mô hình Retrieval-Augmented Generation
3. **Linh Hoạt Với URI Parameters**: Hỗ trợ các pattern phức tạp qua ResourceTemplate
4. **Dễ Quản Lý Phân Quyền**: Chỉ đọc nên có thể áp dụng phân quyền nghiêm ngặt hơn

## Hạn Chế Của Resources

1. **Chỉ Đọc**: Không thể thực hiện hành động thay đổi dữ liệu
2. **Cần Handler Đặc Biệt Cho Parameters**: Cấu hình phức tạp hơn với ResourceTemplate
3. **Schema Không Linh Hoạt Như Tools**: Không có validation schema mạnh mẽ như Zod

## Best Practices Theo Tài Liệu Chính Thức

1. **Cấu Trúc URI Nhất Quán**: Sử dụng cấu trúc `service://resource-type/{parameter}` nhất quán
2. **Metadata Đầy Đủ**: Ghi rõ `mimeType` cho mỗi resource content (application/json, text/plain, etc.)
3. **Triển Khai Đúng ListResourcesRequest**: Đảm bảo liệt kê đầy đủ các resources trong handler này
4. **Khai Báo Capabilities**: Đảm bảo khai báo `resources: {}` trong capabilities khi khởi tạo server
5. **Cẩn Thận Với Pattern Matching**: Đảm bảo URI pattern khớp chính xác giữa đăng ký và xử lý

## Ví Dụ Tương Tác Thực Tế

```
User: "Cho tôi danh sách các project trong Jira"

AI: "Để lấy danh sách project, tôi sẽ truy vấn hệ thống Jira của bạn."

[AI accesses resource jira://projects]

AI: "Đây là danh sách các project từ Jira:

1. DEV - Development (12 active issues)
2. PROD - Production Support (8 active issues) 
3. TEST - Testing (5 active issues)

Bạn muốn xem chi tiết project nào?"

User: "Cho tôi xem chi tiết project DEV"

[AI accesses resource jira://projects/DEV]

AI: "Thông tin chi tiết về project DEV:
- Tên đầy đủ: Development
- Lead: John Smith
- Mô tả: Main development project for core features
- Số lượng issues: 26 (12 active, 14 resolved)
- Sprint hiện tại: Sprint 8 (ends in 5 days)
..."
```

Trong ví dụ trên, Resources cung cấp truy cập nhanh chóng đến dữ liệu có cấu trúc từ Jira mà không cần phê duyệt người dùng, theo đúng mô hình "application-controlled" của MCP.

## Nguồn Tham Khảo

1. [GitHub - ModelContextProtocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
2. [MCP Server Development Guide](https://github.com/cyanheads/model-context-protocol-resources/blob/main/guides/mcp-server-development-guide.md)
3. [How to Build MCP Servers with TypeScript SDK](https://dev.to/shadid12/how-to-build-mcp-servers-with-typescript-sdk-1c28)
4. [Best Practices for MCP Servers](https://www.linkedin.com/pulse/best-practices-mcp-servers-gaurang-desai-7ptqc)
5. [Build Your First MCP Server with TypeScript](https://hackteam.io/blog/build-your-first-mcp-server-with-typescript-in-under-10-minutes/) 