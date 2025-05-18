# Hướng dẫn Phát triển và Sử dụng MCP Atlassian Test Client

Tài liệu này mô tả cách xây dựng và sử dụng `dev_mcp-atlassian-test-client` để test nhanh các resource và tool của MCP Atlassian Server. Việc này hữu ích cho cả quá trình phát triển và kiểm thử.

## 1. Giới thiệu

MCP Atlassian Test Client là một ứng dụng Node.js giúp:
- Test các resource từ Jira và Confluence 
- Test các tool (create/update) của Jira và Confluence
- Kiểm tra metadata và schema của các resource
- Liệt kê và khám phá tất cả resource và tool có sẵn
- Dễ dàng mở rộng để test thêm các resource/tool mới

### 1.1. Cập nhật quan trọng v2.1.1

MCP Atlassian Server đã được refactor lớn (v2.1.1) với những cải tiến:
- Chuẩn hóa toàn bộ cấu trúc resource/tool
- Loại bỏ hoàn toàn resource content-metadata, hợp nhất metadata vào page resource
- Cập nhật tất cả schema và response format theo chuẩn MCP mới nhất
- Tăng cường bảo mật, khả năng mở rộng và bảo trì
- Chuẩn hóa xử lý lỗi

## 2. Cấu trúc Thư mục

Thư mục `dev_mcp-atlassian-test-client` chứa:

```
dev_mcp-atlassian-test-client/
├── package.json         # Cấu hình và dependencies
├── tsconfig.json        # Cấu hình TypeScript
├── dist/                # Code đã biên dịch
└── src/                 # Source code
    ├── list-mcp-inventory.ts      # Liệt kê tất cả resource và tool
    ├── tool-test.ts               # Test tool (tất cả)
    ├── test-jira-issues.ts        # Test resource Jira Issues
    ├── test-jira-projects.ts      # Test resource Jira Projects
    ├── test-jira-users.ts         # Test resource Jira Users
    ├── test-confluence-spaces.ts  # Test resource Confluence Spaces
    └── test-confluence-pages.ts   # Test resource Confluence Pages
```

## 3. Phân tích Cấu trúc Client

### 3.1. Khám phá Resource và Tool với list-mcp-inventory.ts

File `list-mcp-inventory.ts` là công cụ quan trọng để khám phá API của MCP Server:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

async function main() {
  // 1. Khởi tạo client
  const client = new Client({ 
    name: "mcp-atlassian-inventory-list", 
    version: "1.0.0" 
  });
  
  // 2. Cấu hình đường dẫn tới server
  const serverPath = "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js";
  
  // 3. Khởi tạo transport
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: process.env as Record<string, string>
  });

  // 4. Kết nối tới server
  console.log("Connecting to MCP server...");
  await client.connect(transport);

  // 5. Liệt kê danh sách tool
  console.log("\n=== Available Tools ===");
  const toolsResult = await client.listTools();
  console.log(`Total tools: ${toolsResult.tools.length}`);
  toolsResult.tools.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool.name}: ${tool.description || 'No description'}`);
  });

  // 6. Liệt kê danh sách resource
  console.log("\n=== Available Resources ===");
  let resourcesResult = await client.listResources();
  console.log(`Total resources: ${resourcesResult.resources.length}`);
  resourcesResult.resources.forEach((resource, index) => {
    console.log(`${index + 1}. ${resource.uriPattern || resource.uri}: ${resource.description || 'No description'}`);
  });
  
  // 7. Hiển thị schema của một số tool quan trọng
  console.log("\n=== Tool Details ===");
  const toolsToInspect = ["createIssue", "updatePage", "addComment"];
  for (const toolName of toolsToInspect) {
    const tool = toolsResult.tools.find(t => t.name === toolName);
    if (tool) {
      console.log(`\nTool: ${tool.name}`);
      console.log(`Description: ${tool.description || 'No description'}`);
      console.log("Input Schema:", JSON.stringify(tool.inputSchema, null, 2));
    }
  }

  // 8. Đóng kết nối
  await client.close();
  console.log("\nDone.");
}

main();
```

Công cụ này giúp:
- Liệt kê tất cả resource và tool hiện có
- Hiển thị mô tả và schema của từng resource/tool
- Phân loại resource/tool theo nhóm (Jira, Confluence)
- Hiển thị chi tiết schema của các tool quan trọng

### 3.2. Cấu trúc File Test Resource

Các file test resource (`test-jira-issues.ts`, `test-confluence-pages.ts`, v.v.) có cấu trúc tương tự:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';
import { fileURLToPath } from "url";
import fs from "fs";

// Đọc biến môi trường từ .env
function loadEnv(): Record<string, string> {
  // ... code để đọc file .env
}

// Hàm in metadata và schema chuẩn hóa
function printResourceMetaAndSchema(res: any) {
  if (res.contents && res.contents.length > 0) {
    const content = res.contents[0];
    // In metadata (chuẩn hóa theo v2.1.1)
    if (content.text) {
      try {
        const data = JSON.parse(String(content.text));
        // Hiển thị metadata chuẩn hóa
        if (data.metadata) {
          console.log("Metadata:", data.metadata);
          // Phân tích và hiển thị metadata fields hữu ích
          if (data.metadata.total) {
            console.log(`Total items: ${data.metadata.total}`);
          }
          if (data.metadata.links) {
            console.log("Navigation links:", data.metadata.links);
          }
        }
        
        // Hiển thị dữ liệu chính
        // Với format chuẩn hóa mới v2.1.1, data được chứa trong key tương ứng (issues, projects, pages, etc.)
        const dataKeys = Object.keys(data).filter(key => 
          key !== 'metadata' && Array.isArray(data[key])
        );
        
        if (dataKeys.length > 0) {
          const primaryKey = dataKeys[0];
          console.log(`Data key: ${primaryKey}`);
          console.log(`Number of items: ${data[primaryKey].length}`);
          if (data[primaryKey].length > 0) {
            console.log("First item sample:", data[primaryKey][0]);
          }
        } else {
          // Nếu không phải array, hiển thị trực tiếp data object
          console.log("Data:", data);
        }
      } catch {
        console.log("Cannot parse text.");
      }
    }
  }
}

async function main() {
  // 1. Khởi tạo client
  const client = new Client({
    name: "mcp-atlassian-test-client-jira-issues",
    version: "1.0.0"
  });

  // 2. Cấu hình đường dẫn tới server
  const serverPath = "/opt/homebrew/lib/node_modules/@phuc-nt/mcp-atlassian-server/dist/index.js";

  // 3. Lấy biến môi trường
  const envVars = loadEnv();
  
  // 4. Khởi tạo transport
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: {
      ...process.env,
      ...envVars
    }
  });

  // 5. Kết nối tới server
  console.log("Connecting to MCP server...");
  await client.connect(transport);

  // 6. Định nghĩa test data
  const issueKey = "XDEMO2-53";
  const resourceUris = [
    `jira://issues`,
    `jira://issues/${issueKey}`,
    `jira://issues/${issueKey}/transitions`,
    `jira://issues/${issueKey}/comments`
  ];

  // 7. Vòng lặp test từng resource
  for (const uri of resourceUris) {
    try {
      console.log(`\nResource: ${uri}`);
      // 7.1. Gọi resource
      const res = await client.readResource({ uri });
      
      // 7.2. Xử lý response
      if (uri === "jira://issues") {
        const issuesData = JSON.parse(String(res.contents[0].text));
        console.log("Number of issues:", issuesData.issues?.length || 0);
      }
      
      // 7.3. In metadata và schema
      printResourceMetaAndSchema(res);
    } catch (e) {
      // 7.4. Xử lý lỗi
      console.error(`Resource ${uri} error:`, e instanceof Error ? e.message : e);
    }
  }

  // 8. Đóng kết nối
  await client.close();
}

main();
```

### 3.3. Luồng xử lý của client

Mỗi client test thực hiện các bước sau:

1. **Khởi tạo client**: Tạo instance của `Client` với tên và version.
2. **Cấu hình server**: Xác định đường dẫn đến MCP server.
3. **Cấu hình môi trường**: Đọc biến môi trường từ file `.env`.
4. **Khởi tạo transport**: Tạo kênh giao tiếp với server thông qua `StdioClientTransport`.
5. **Kết nối**: Gọi `client.connect()` để thiết lập kết nối.
6. **Định nghĩa test data**: Xác định các resource URI cần test.
7. **Thực thi test**: Thực hiện các lệnh gọi API.
8. **Xử lý kết quả**: Parse và hiển thị kết quả, in metadata và schema.
9. **Đóng kết nối**: Gọi `client.close()` khi hoàn thành.

### 3.4. API Chính của MCP Client

1. **client.connect(transport)**: Thiết lập kết nối với MCP Server.
2. **client.listResources()**: Liệt kê tất cả resource có sẵn.
3. **client.listTools()**: Liệt kê tất cả tool có sẵn.
4. **client.readResource({ uri })**: Đọc dữ liệu từ một resource.
5. **client.invokeTool(name, params)**: Gọi một tool với các tham số.
6. **client.close()**: Đóng kết nối.

## 4. Cài đặt và Build

### Cài đặt phụ thuộc

```bash
cd dev_mcp-atlassian-test-client
npm install
```

### Build Client

```bash
cd dev_mcp-atlassian-test-client
npm run build
```

Lệnh này sẽ biên dịch TypeScript thành JavaScript trong thư mục `dist/`.

## 5. Cách Sử Dụng Test Client

### 5.1. Khám phá các Resource và Tool có sẵn

```bash
cd dev_mcp-atlassian-test-client
npx ts-node --esm src/list-mcp-inventory.ts
```

Lệnh này sẽ liệt kê tất cả resource và tool có sẵn, phân loại theo nhóm, và hiển thị schema của một số tool quan trọng.

### 5.2. Test Resource

Có nhiều cách để test các resource:

#### A. Test từng nhóm resource riêng biệt

```bash
# Jira Issues
npx ts-node --esm src/test-jira-issues.ts

# Jira Projects
npx ts-node --esm src/test-jira-projects.ts

# Jira Users
npx ts-node --esm src/test-jira-users.ts

# Confluence Spaces
npx ts-node --esm src/test-confluence-spaces.ts

# Confluence Pages
npx ts-node --esm src/test-confluence-pages.ts
```

### 5.3. Test Tool

```bash
# Test tất cả tool
npx ts-node --esm src/tool-test.ts
```

## 6. Dữ liệu Test

Mỗi file test có các biến với dữ liệu mẫu mà bạn nên điều chỉnh cho phù hợp với môi trường của mình:

```typescript
// test-jira-issues.ts
const issueKey = "XDEMO2-53";

// test-jira-projects.ts
const projectKey = "XDEMO2";

// test-jira-users.ts
const accountId = "557058:24acce7b-a0c1-4f45-97f1-7eb4afd2ff5f";
const projectKey = "XDEMO2";
const roleId = "10002";

// test-confluence-spaces.ts
const spaceKey = "TX";

// test-confluence-pages.ts
const pageId = "16482305";
const cql = "type=page";
```

## 7. Kiểm Tra Metadata và Schema Chuẩn Hóa Mới (v2.1.1)

Sau khi refactoring lớn (v2.1.1), tất cả resource trả về metadata và schema theo cấu trúc chuẩn hóa. Hãy xem cấu trúc mới này:

### 7.1. Cấu trúc Resource Response mới

```json
{
  "metadata": {
    "total": 54,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "links": {
      "self": "jira://issues",
      "ui": "https://phuc-nt.atlassian.net/issues/",
      "next": "jira://issues?offset=20&limit=20"
    }
  },
  "issues": [
    {
      "id": "10001",
      "key": "PROJ-123",
      "summary": "Issue summary",
      // ...các trường khác
    },
    // ...các issue khác
  ]
}
```

### 7.2. Cách đọc và xử lý data (MCP Client)

```typescript
// Đọc danh sách issue và xử lý metadata chuẩn hóa
const issuesResult = await client.readResource({ uri: "jira://issues" });
const responseData = JSON.parse(issuesResult.contents[0].text);

// Xử lý metadata
const { metadata } = responseData;
console.log(`Tổng số item: ${metadata.total}`);
console.log(`Đã load: ${responseData.issues.length} / ${metadata.total}`);
console.log(`Còn trang tiếp theo: ${metadata.hasMore ? 'Có' : 'Không'}`);

// Phân trang với next link
if (metadata.links && metadata.links.next) {
  const nextPageResult = await client.readResource({ uri: metadata.links.next });
  // Xử lý trang tiếp theo...
}

// Xử lý dữ liệu chính (nằm trong key tương ứng với loại resource)
const { issues } = responseData;
issues.forEach(issue => {
  console.log(`Issue ${issue.key}: ${issue.summary}`);
});
```

### 7.3. Cấu trúc Tool Response mới

```json
{
  "success": true,
  "id": "10001",
  "key": "PROJ-123", 
  "message": "Issue created successfully"
}
```

hoặc lỗi:

```json
{
  "success": false,
  "message": "Error creating issue: Permission denied",
  "code": "PERMISSION_ERROR",
  "statusCode": 403
}
```

## 8. Phát triển Client Riêng

Để phát triển một MCP client riêng cho ứng dụng của bạn, hãy làm theo các bước sau:

### 8.1. Cài đặt MCP SDK

```bash
npm install @modelcontextprotocol/sdk
```

### 8.2. Khởi tạo Client

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Khởi tạo client
const client = new Client({
  name: "your-mcp-client",
  version: "1.0.0"
});

// Cấu hình server
const serverPath = "/path/to/your/mcp-server/dist/index.js";

// Khởi tạo transport
const transport = new StdioClientTransport({
  command: "node",
  args: [serverPath],
  env: process.env
});

// Kết nối
await client.connect(transport);
```

### 8.3. Sử dụng Resource (chuẩn hóa v2.1.1)

```typescript
// Đọc danh sách issue
const issuesResult = await client.readResource({ uri: "jira://issues" });
const responseData = JSON.parse(issuesResult.contents[0].text);
// Lấy metadata chuẩn hóa
const { metadata } = responseData;
// Lấy danh sách issue 
const { issues } = responseData;
console.log(`Loaded ${issues.length} of total ${metadata.total} issues`);

// Xử lý phân trang
if (metadata.hasMore && metadata.links.next) {
  // Fetch trang tiếp theo
  const nextPage = await client.readResource({ uri: metadata.links.next });
  // ... xử lý tiếp
}
```

### 8.4. Sử dụng Tool (chuẩn hóa v2.1.1)

```typescript
// Tạo issue mới
const createResult = await client.invokeTool("createIssue", {
  projectKey: "PROJ",
  summary: "Test issue created via MCP",
  description: "This is a test issue created using MCP client",
  issueType: "Task"
});

// Parse kết quả JSON
const createResponse = JSON.parse(createResult.content[0].text);

// Kiểm tra success flag (chuẩn hóa v2.1.1)
if (createResponse.success) {
  console.log("Issue created successfully!");
  console.log(`Issue key: ${createResponse.key}`);
  console.log(`Issue ID: ${createResponse.id}`);
} else {
  console.error("Error creating issue:", createResponse.message);
  // Xử lý error code nếu có
  if (createResponse.code) {
    console.error("Error code:", createResponse.code);
  }
}
```

### 8.5. Xử lý lỗi (Cải tiến v2.1.1)

```typescript
try {
  const result = await client.readResource({ uri: "jira://nonexistent" });
  const data = JSON.parse(result.contents[0].text);
  // Kiểm tra success flag nếu response là từ tool
  if ('success' in data && data.success === false) {
    console.error("Error in response:", data.message);
    return;
  }
  // Xử lý kết quả
} catch (error) {
  console.error("Error:", error instanceof Error ? error.message : String(error));
  // Xử lý lỗi
}
```

## 9. Khắc phục sự cố

### 9.1. Vấn đề về kết nối

Nếu không thể kết nối đến MCP server:
- Kiểm tra đường dẫn đến server (`serverPath`) có chính xác không
- Đảm bảo MCP server đã được build và cài đặt đúng cách
- Kiểm tra file `.env` có chứa thông tin xác thực Atlassian cần thiết không

### 9.2. Vấn đề về biến môi trường

Nếu client không đọc được biến môi trường:
- Kiểm tra file `.env` có tồn tại trong thư mục gốc của dự án không
- Đảm bảo biến môi trường được định dạng đúng (`KEY=VALUE`)
- Thử truyền biến môi trường trực tiếp khi khởi tạo transport

### 9.3. Vấn đề về API Atlassian

Nếu nhận được lỗi từ API Atlassian:
- Kiểm tra các thông tin xác thực Atlassian (site name, email, API token)
- Đảm bảo API token có đủ quyền truy cập vào tài nguyên được yêu cầu
- Kiểm tra các tham số URI (issueKey, projectKey, ...) có tồn tại trong Atlassian instance của bạn không

## 10. Liên kết hữu ích

- [MCP Protocol Documentation](https://github.com/modelcontextprotocol/mcp)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Atlassian API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
- [MCP Server Architecture](../knowledge/01-mcp-overview-architecture.md)
- [MCP Tools and Resources Guide](../knowledge/02-mcp-tools-resources.md)
- [Resources-and-Tools Documentation](../introduction/resources-and-tools.md)

---

*Cập nhật lần cuối: Tháng 5, 2025 (v2.1.1)* 