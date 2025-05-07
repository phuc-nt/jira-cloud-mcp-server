# Hướng Dẫn Chuẩn Hóa Metadata và Bổ Sung Schema cho MCP Server

## 1. Chuẩn Hóa Metadata Trả Về

### Tạo Cấu Trúc Metadata Nhất Quán

```typescript
// Định nghĩa interface chuẩn cho metadata
interface StandardMetadata {
  total: number;          // Tổng số bản ghi
  limit: number;          // Số bản ghi tối đa trả về
  offset: number;         // Vị trí bắt đầu
  hasMore: boolean;       // Còn dữ liệu không
  links?: {               // Các liên kết hữu ích
    self: string;         // Link đến resource hiện tại
    ui?: string;          // Link đến UI Atlassian
    next?: string;        // Link đến trang tiếp theo
  }
}

// Hàm helper để tạo metadata chuẩn
function createStandardMetadata(
  total: number,
  limit: number,
  offset: number,
  baseUrl: string,
  uiUrl?: string
): StandardMetadata {
  const hasMore = offset + limit  {
    // Xử lý query parameters
    const url = new URL(uri.href);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    
    // Lấy dữ liệu từ Jira API
    const issues = await jiraClient.getIssues(limit, offset);
    const total = issues.total;
    
    // Tạo metadata chuẩn
    const metadata = createStandardMetadata(
      total,
      limit,
      offset,
      uri.href,
      `https://${process.env.ATLASSIAN_SITE_NAME}/jira/issues`
    );
    
    // Trả về kết quả với metadata chuẩn
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          metadata,
          issues: issues.issues
        })
      }]
    };
  }
);
```

## 2. Bổ Sung Schema Cho Resource MCP

### Định Nghĩa Schema Cho Resource

```typescript
// Định nghĩa schema cho issue
const issueSchema = {
  type: "object",
  properties: {
    key: { type: "string", description: "Issue key (e.g., PROJ-123)" },
    summary: { type: "string", description: "Issue title/summary" },
    status: { 
      type: "object", 
      properties: {
        name: { type: "string", description: "Status name" },
        id: { type: "string", description: "Status ID" }
      }
    },
    assignee: {
      type: "object",
      properties: {
        displayName: { type: "string", description: "Assignee's display name" },
        accountId: { type: "string", description: "Assignee's account ID" }
      },
      nullable: true
    }
  },
  required: ["key", "summary", "status"]
};

// Schema cho danh sách issues
const issuesListSchema = {
  type: "object",
  properties: {
    metadata: {
      type: "object",
      properties: {
        total: { type: "number", description: "Total number of issues" },
        limit: { type: "number", description: "Maximum number of issues returned" },
        offset: { type: "number", description: "Starting position" },
        hasMore: { type: "boolean", description: "Whether there are more issues" },
        links: {
          type: "object",
          properties: {
            self: { type: "string", description: "Link to this resource" },
            ui: { type: "string", description: "Link to Atlassian UI" },
            next: { type: "string", description: "Link to next page" }
          }
        }
      },
      required: ["total", "limit", "offset", "hasMore"]
    },
    issues: {
      type: "array",
      items: issueSchema
    }
  },
  required: ["metadata", "issues"]
};
```

### Đăng Ký Resource Với Schema

```typescript
// Khi đăng ký resource với server
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "jira://issues",
      name: "Jira Issues",
      description: "List of Jira issues with pagination",
      mimeType: "application/json",
      schema: issuesListSchema  // Thêm schema vào metadata resource
    },
    // Các resource khác...
  ]
}));
```

### Trả Về Schema Trong Response

```typescript
// Trong handler của resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "jira://issues") {
    // Xử lý logic lấy dữ liệu...
    
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(responseData),
        schema: issuesListSchema  // Thêm schema vào response
      }]
    };
  }
  // Xử lý các resource khác...
});
```

## 3. Áp Dụng Cho Tất Cả Resource

Để áp dụng nhất quán cho tất cả resource, bạn nên:

1. **Tạo thư viện schema**: Tạo file riêng chứa tất cả schema (ví dụ: `schemas/jira.ts`, `schemas/confluence.ts`)
2. **Tạo helper function**: Viết các hàm helper để tạo metadata chuẩn và response chuẩn
3. **Áp dụng cho tất cả resource handler**: Đảm bảo mọi resource đều sử dụng cấu trúc và helper giống nhau

```typescript
// Ví dụ helper function
function createResourceResponse(uri: string, data: any, schema: any) {
  return {
    contents: [{
      uri,
      mimeType: "application/json",
      text: JSON.stringify(data),
      schema
    }]
  };
}
```

## 4. Kiểm Tra Với Cline

Sau khi triển khai, hãy kiểm tra với Cline để đảm bảo:
- Cline hiển thị đúng kiểu dữ liệu (không còn "Returns Unknown")
- Cline có thể render UI thông minh dựa trên schema
- Metadata được hiển thị và sử dụng đúng (phân trang, liên kết, v.v.)

Việc chuẩn hóa này sẽ giúp MCP server của bạn chuyên nghiệp hơn, dễ sử dụng với AI agent, và tương thích tốt hơn với hệ sinh thái MCP.