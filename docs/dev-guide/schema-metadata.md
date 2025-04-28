# Hướng Dẫn Khai Báo Schema & Metadata Cho Resource MCP

Để MCP server hiển thị đúng metadata (mimeType/schema/description) cho từng resource và tránh tình trạng "Returns Unknown" trên Cline hoặc các MCP client khác, bạn cần **khai báo metadata khi đăng ký resource** cũng như **trả về metadata trong các response**. Dưới đây là hướng dẫn chi tiết, tổng hợp từ tài liệu chính thức:

---

## 1. Khai Báo Metadata Khi Đăng Ký Resource

### a. Khi đăng ký resource trong ListResourcesRequest

Khi xử lý request `ListResourcesRequest`, bạn cần trả về danh sách resource với đầy đủ thông tin metadata:

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "jira://users",
        name: "Danh sách người dùng Jira",
        description: "Trả về tất cả user trong hệ thống Jira",
        mimeType: "application/json"
      },
      {
        uri: "jira://users/{accountId}",
        name: "Thông tin user Jira",
        description: "Trả về thông tin chi tiết của một user theo accountId",
        mimeType: "application/json"
      },
      // ... các resource khác
    ]
  };
});
```
**Lưu ý:**  
- `uri`: Định danh duy nhất của resource  
- `name`: Tên thân thiện cho resource  
- `description`: Mô tả ngắn gọn về dữ liệu trả về  
- `mimeType`: Kiểu dữ liệu trả về (ví dụ: `"application/json"`, `"text/plain"`)  

### b. Khi đăng ký resource template (dynamic resource)

Nếu resource có tham số, sử dụng `resourceTemplates`:

```typescript
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return {
    resourceTemplates: [
      {
        uriTemplate: "jira://users/{accountId}",
        name: "Thông tin user Jira (dynamic)",
        description: "Trả về thông tin user theo accountId",
        mimeType: "application/json"
      }
      // ... các template khác
    ]
  };
});
```

---

## 2. Trả Về Metadata Trong Response Khi Đọc Resource

Khi xử lý request `ReadResourceRequest`, đảm bảo mỗi phần tử trong mảng `contents` có trường `mimeType` phù hợp:

```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  // ... lấy dữ liệu từ API hoặc nguồn khác
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data) // hoặc .blob nếu là binary
      }
    ]
  };
});
```
**Lưu ý:**  
- `mimeType` phải khớp với khai báo ở bước 1  
- Nếu resource trả về text, sử dụng trường `text`; nếu trả về binary, sử dụng trường `blob` (base64)

---

## 3. Best Practices & Checklist

- **Luôn khai báo `mimeType` và `description` cho mọi resource và resource template**  
- **Đảm bảo `mimeType` trong response khớp với khai báo trong ListResourcesRequest**  
- **Đặt tên và mô tả resource rõ ràng, giúp AI và người dùng dễ hiểu**  
- **Kiểm tra lại bằng client (Cline, MCP Inspector) để xác nhận metadata hiển thị đúng**

---

## 4. Ví Dụ Đầy Đủ

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/server/schemas.js";

// Khởi tạo server
const server = new McpServer({ name: "jira-mcp", version: "1.0.0" }, { capabilities: { resources: {} } });

// Đăng ký resource tĩnh
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "jira://users",
      name: "Danh sách user Jira",
      description: "Trả về tất cả user trong hệ thống Jira",
      mimeType: "application/json"
    }
  ]
}));

// Đăng ký resource động (template)
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
  resourceTemplates: [
    {
      uriTemplate: "jira://users/{accountId}",
      name: "Thông tin user Jira",
      description: "Trả về thông tin user theo accountId",
      mimeType: "application/json"
    }
  ]
}));

// Đọc resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (uri === "jira://users") {
    // ... lấy danh sách user
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(users)
        }
      ]
    };
  }
  // ... các resource khác
  throw new Error("Resource not found");
});
```

---

## 5. Tài liệu tham khảo

- [Model Context Protocol - Resources Overview](https://modelcontextprotocol.io/docs/concepts/resources)
- [MCP Server Development Guide](https://github.com/cyanheads/model-context-protocol-resources/blob/main/guides/mcp-server-development-guide.md)
- [MCP Server Template - Reference](https://github.com/deachne/MCP-server-template/blob/main/docs/mcp-reference.md)
- [MCP TypeScript SDK - Quick Start](https://github.com/modelcontextprotocol/typescript-sdk)

---

**Tóm lại:**  
Để giải quyết vấn đề "Returns Unknown", bạn cần **khai báo đầy đủ metadata (`mimeType`, `description`, v.v.) khi đăng ký resource và trả về metadata này trong response**. Điều này giúp MCP client (như Cline) nhận diện và hiển thị đúng kiểu dữ liệu cho từng resource. 