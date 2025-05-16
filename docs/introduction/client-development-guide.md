# Hướng dẫn Phát triển và Sử dụng MCP Atlassian Test Client

Tài liệu này mô tả cách xây dựng và sử dụng `dev_mcp-atlassian-test-client` để test nhanh các resource và tool của MCP Atlassian Server. Việc này hữu ích cho cả quá trình phát triển và kiểm thử.

## 1. Giới thiệu

MCP Atlassian Test Client là một ứng dụng Node.js giúp:
- Test các resource từ Jira và Confluence 
- Test các tool (create/update) của Jira và Confluence
- Kiểm tra metadata và schema của các resource
- Liệt kê và khám phá tất cả resource và tool có sẵn
- Dễ dàng mở rộng để test thêm các resource/tool mới

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

// Hàm in metadata và schema
function printResourceMetaAndSchema(res: any) {
  if (res.contents && res.contents.length > 0) {
    const content = res.contents[0];
    // In metadata
    if (content.metadata) {
      console.log("Metadata:", content.metadata);
    }
    // In schema
    if (content.schema) {
      console.log("Schema:", JSON.stringify(content.schema, null, 2));
    }
    // Parse và hiển thị dữ liệu
    if (content.text) {
      try {
        const data = JSON.parse(String(content.text));
        // Hiển thị dữ liệu một cách hợp lý
        if (Array.isArray(data)) {
          console.log("Data (array, first element):", data[0]);
        } else if (typeof data === 'object') {
          console.log("Data (object):", data);
        } else {
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

## 7. Kiểm Tra Metadata và Schema

Tất cả các file test đều bao gồm hàm `printResourceMetaAndSchema()` để in metadata và schema của mỗi resource, giúp kiểm tra nhanh việc chuẩn hóa.

Ví dụ output:
```
Metadata: {
  total: 54,
  limit: 20,
  offset: 0,
  hasMore: true,
  links: {
    self: 'jira://issues',
    ui: 'https://phuc-nt.atlassian.net/issues/',
    next: 'jira://issues?offset=20&limit=20'
  }
}
Schema: {
  "type": "object",
  "properties": {
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "key": { "type": "string" },
          "summary": { "type": "string" },
          // ...
        }
      }
    }
  }
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

### 8.3. Sử dụng Resource

```typescript
// Đọc danh sách issue
const issuesResult = await client.readResource({ uri: "jira://issues" });
const issuesData = JSON.parse(issuesResult.contents[0].text);
console.log("Issues:", issuesData.issues);

// Đọc chi tiết issue
const issueKey = "PROJ-123";
const issueResult = await client.readResource({ uri: `jira://issues/${issueKey}` });
const issueData = JSON.parse(issueResult.contents[0].text);
console.log("Issue details:", issueData.issue);
```

### 8.4. Sử dụng Tool

```typescript
// Tạo issue mới
const createResult = await client.invokeTool("createIssue", {
  projectKey: "PROJ",
  summary: "Test issue created via MCP",
  description: "This is a test issue created using MCP client",
  issueType: "Task"
});
console.log("Create result:", createResult.content[0].text);

// Cập nhật issue
const updateResult = await client.invokeTool("updateIssue", {
  issueKey: "PROJ-123",
  summary: "Updated test issue",
  description: "This issue was updated via MCP client"
});
console.log("Update result:", updateResult.content[0].text);
```

### 8.5. Xử lý lỗi

```typescript
try {
  const result = await client.readResource({ uri: "jira://nonexistent" });
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

---

*Cập nhật lần cuối: Tháng 5, 2025* 