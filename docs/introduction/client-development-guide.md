# Hướng dẫn Phát triển và Sử dụng MCP Atlassian Test Client

Tài liệu này mô tả cách xây dựng và sử dụng `dev_mcp-atlassian-test-client` để test nhanh các resource và tool của MCP Atlassian Server. Việc này hữu ích cho cả quá trình phát triển và kiểm thử.

## 1. Giới thiệu

MCP Atlassian Test Client là một ứng dụng Node.js giúp:
- Test các resource từ Jira và Confluence 
- Test các tool (create/update) của Jira và Confluence
- Kiểm tra metadata và schema của các resource
- Dễ dàng mở rộng để test thêm các resource/tool mới

## 2. Cấu trúc Thư mục

Thư mục `dev_mcp-atlassian-test-client` chứa:

```
dev_mcp-atlassian-test-client/
├── package.json         # Cấu hình và dependencies
├── tsconfig.json        # Cấu hình TypeScript
├── dist/                # Code đã biên dịch
└── src/                 # Source code
    ├── index.ts                   # Test tổng hợp
    ├── resource-test.ts           # Test resource (tất cả)
    ├── tool-test.ts               # Test tool (tất cả)
    ├── test-jira-issues.ts        # Test resource Jira Issues
    ├── test-jira-projects.ts      # Test resource Jira Projects
    ├── test-jira-users.ts         # Test resource Jira Users
    ├── test-confluence-spaces.ts  # Test resource Confluence Spaces
    └── test-confluence-pages.ts   # Test resource Confluence Pages
```

## 3. Phân tích Cấu trúc File Test

Để hiểu cách xây dựng một MCP client đơn giản, hãy phân tích cấu trúc của file `test-jira-issues.ts`:

### 3.1. Imports và Dependencies

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';
import { fileURLToPath } from "url";
import fs from "fs";
```

- `Client`: Class chính từ MCP SDK, dùng để tương tác với MCP Server.
- `StdioClientTransport`: Cơ chế transport qua stdio, cho phép giao tiếp với server thông qua child process.
- `path`, `fileURLToPath`, `fs`: Các module Node.js để xử lý đường dẫn và file.

### 3.2. Các Hàm Tiện ích

```typescript
// Đọc biến môi trường từ .env
function loadEnv(): Record<string, string> {
  // ... code để đọc file .env
}

// Hàm in metadata và schema
function printResourceMetaAndSchema(res: any) {
  // ... code để in metadata và schema từ response
}
```

- `loadEnv()`: Đọc biến môi trường từ file `.env` để cấu hình kết nối với Atlassian.
- `printResourceMetaAndSchema()`: In metadata và schema từ response để kiểm tra chuẩn hóa.

### 3.3. Hàm main() - Flow Chính

```typescript
async function main() {
  // 1. Khởi tạo client
  const client = new Client({
    name: "mcp-atlassian-test-client-jira-issues",
    version: "1.0.0"
  });

  // 2. Cấu hình đường dẫn tới server
  const serverPath = path.resolve(process.cwd(), "dist/index.js");

  // 3. Lấy biến môi trường
  const envVars = loadEnv();
  // ...

  // 4. Khởi tạo transport
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: {
      ...processEnv,
      ...envVars
    }
  });

  // 5. Kết nối tới server
  await client.connect(transport);

  // 6. Định nghĩa test data
  const issueKey = "XDEMO2-53";
  const resourceUris = [
    `jira://issues`,
    `jira://issues/${issueKey}`,
    // ...
  ];

  // 7. Vòng lặp test từng resource
  for (const uri of resourceUris) {
    try {
      // 7.1. Gọi resource
      const res = await client.readResource({ uri });
      
      // 7.2. Xử lý response
      if (uri === "jira://issues") {
        const issuesData = JSON.parse(String(res.contents[0].text));
        console.log("Số lượng issues:", issuesData.issues?.length || 0);
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
```

### 3.4. Luồng xử lý của client

1. **Khởi tạo client**: Tạo instance của `Client` với tên và version.
2. **Cấu hình server**: Xác định đường dẫn đến MCP server.
3. **Cấu hình môi trường**: Đọc biến môi trường từ file `.env`.
4. **Khởi tạo transport**: Tạo kênh giao tiếp với server thông qua `StdioClientTransport`.
5. **Kết nối**: Gọi `client.connect()` để thiết lập kết nối.
6. **Định nghĩa test data**: Xác định các resource URI cần test.
7. **Thực thi test**: Lặp qua các URI và gọi `client.readResource()`.
8. **Xử lý kết quả**: Parse và hiển thị kết quả, in metadata và schema.
9. **Đóng kết nối**: Gọi `client.close()` khi hoàn thành.

### 3.5. Các thành phần chính của MCP Client

1. **Client Instance**: Đối tượng chính để tương tác với MCP Server.
2. **Transport**: Cơ chế giao tiếp giữa client và server (ở đây là `StdioClientTransport`).
3. **Resource URI**: Định danh của resource, tuân theo chuẩn MCP (ví dụ: `jira://issues`).
4. **Response Format**: Kết quả trả về từ `readResource()` có cấu trúc chuẩn với `contents`, `metadata`, và `schema`.

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

### 5.1. Test Resource

Có hai cách để test resource:

#### A. Test tất cả resource cùng lúc

```bash
# Từ thư mục gốc của dự án
node dev_mcp-atlassian-test-client/dist/resource-test.js
```

#### B. Test từng nhóm resource riêng biệt

```bash
# Jira Issues
node dev_mcp-atlassian-test-client/dist/test-jira-issues.js

# Jira Projects
node dev_mcp-atlassian-test-client/dist/test-jira-projects.js

# Jira Users
node dev_mcp-atlassian-test-client/dist/test-jira-users.js

# Confluence Spaces
node dev_mcp-atlassian-test-client/dist/test-confluence-spaces.js

# Confluence Pages
node dev_mcp-atlassian-test-client/dist/test-confluence-pages.js
```

### 5.2. Test Tool

```bash
# Từ thư mục gốc của dự án
node dev_mcp-atlassian-test-client/dist/tool-test.js
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
    "metadata": { ... },
    "issues": { ... }
  },
  "required": [
    "metadata",
    "issues"
  ]
}
```

## 8. Tùy Chỉnh Client Test

### 8.1. Chỉnh sửa Resource URI

Mỗi file test chứa một mảng `resourceUris` mà bạn có thể chỉnh sửa để test các resource khác.

```typescript
const resourceUris = [
  `jira://issues`,
  `jira://issues/${issueKey}`,
  // Thêm các URI khác tại đây
];
```

### 8.2. Thêm Test Resource/Tool Mới

Để tạo test mới, sao chép một file test hiện có và cập nhật URI, fields, hoặc arguments phù hợp với resource/tool mới.

## 9. Vấn Đề Đã Phát Hiện

Quá trình test đã phát hiện một số vấn đề:

1. **Đường dẫn tới MCP Server:** Trong các file test, đảm bảo sử dụng đường dẫn đúng đến file server:
   ```typescript
   const serverPath = path.resolve(process.cwd(), "dist/index.js");
   ```

2. **Lỗi CQL query trong Confluence:** Resource `confluence://pages?cql=type%3Dpage` bị lỗi:
   ```
   Error: Confluence API error: {"statusCode":400,"data":{"authorized":true,"valid":true,"errors":[],"successful":true},"message":"com.atlassian.confluence.api.service.exceptions.BadRequestException: Could not parse cql : "}
   ```
   Cần kiểm tra cú pháp CQL và cách encode URL parameters.

3. **Issue với User Resource:** Trong một số trường hợp, `jira://users/{accountId}` trả về thông tin user nhưng không đúng định dạng, khiến cho việc hiển thị trong test client bị thiếu thông tin.

4. **Số lượng resource được phân trang:** Mặc định, các resource danh sách như `jira://issues` hoặc `confluence://spaces/{spaceKey}/pages` giới hạn số lượng kết quả trả về. Cần sử dụng tham số phân trang (`limit`, `offset`) để lấy đầy đủ dữ liệu.

## 10. Lưu ý quan trọng

1. **Biến Môi Trường:** Test client sử dụng file `.env` trong thư mục gốc. Đảm bảo file này có đầy đủ các biến môi trường cần thiết:
   ```
   ATLASSIAN_SITE_NAME=phuc-nt.atlassian.net
   ATLASSIAN_USER_EMAIL=your-email@example.com
   ATLASSIAN_API_TOKEN=your-api-token
   ```

2. **Build đồng bộ:** Khi chỉnh sửa code client, đảm bảo build lại cả server và client:
   ```bash
   npm run build            # Trong thư mục gốc
   cd dev_mcp-atlassian-test-client && npm run build    # Build client
   ```

3. **Logging:** Nếu bạn muốn xem log chi tiết hơn, hãy điều chỉnh biến môi trường `LOG_LEVEL` trong file `.env` hoặc thêm vào code:
   ```typescript
   // Thêm vào đầu file test
   process.env.LOG_LEVEL = 'debug';
   ```

## 11. Kết luận

MCP Atlassian Test Client là công cụ hữu ích để kiểm tra nhanh các resource và tool của MCP Atlassian Server. Thông qua các test này, bạn có thể đảm bảo rằng server đang hoạt động đúng và trả về đúng định dạng dữ liệu cho client MCP như Cline. 