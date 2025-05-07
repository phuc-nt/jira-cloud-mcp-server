Để tạo một MCP Client đơn giản để test các thay đổi của MCP server trước khi test với Cline, bạn có thể làm theo các bước sau:

## Tạo MCP Test Client đơn giản

### 1. Cài đặt SDK
```bash
npm install @modelcontextprotocol/sdk
```

### 2. Tạo file client.js (hoặc client.ts)
```javascript
import { Client, Implementation } from "@modelcontextprotocol/sdk/client/mcp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

// Đường dẫn đến MCP server của bạn
const SERVER_PATH = "./dist/index.js";

async function main() {
  try {
    // Khởi tạo process cho server
    const process = spawn("node", [SERVER_PATH]);
    
    // Tạo transport kết nối với server qua stdio
    const transport = new StdioClientTransport({
      input: process.stdout,
      output: process.stdin
    });
    
    // Tạo MCP client
    const client = new Client(
      new Implementation("test-client", "1.0.0")
    );
    
    // Kết nối với server
    await client.connect(transport);
    console.log("Connected to MCP server");
    
    // Liệt kê các resources
    const resources = await client.listResources();
    console.log("Available resources:", resources?.resources?.map(r => r.uri) || []);
    
    // Liệt kê các tools
    const tools = await client.listTools();
    console.log("Available tools:", tools?.tools?.map(t => t.name) || []);
    
    // Test một resource (ví dụ: jira://issues)
    if (resources?.resources?.some(r => r.uri === "jira://issues")) {
      const result = await client.readResource("jira://issues");
      console.log("Resource result:", JSON.parse(result.contents[0].text));
    }
    
    // Test một tool (ví dụ: createIssue)
    if (tools?.tools?.some(t => t.name === "createIssue")) {
      const result = await client.callTool("createIssue", {
        projectKey: "DEMO",
        summary: "Test issue from MCP client"
      });
      console.log("Tool result:", result);
    }
    
    // Đóng kết nối
    await client.close();
    process.kill();
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
```

### 3. Tạo script test có tham số

Bạn có thể tạo một script test linh hoạt hơn, cho phép truyền tham số:

```javascript
import { Client, Implementation } from "@modelcontextprotocol/sdk/client/mcp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testResource(client, resourceUri) {
  try {
    const result = await client.readResource(resourceUri);
    console.log(`Resource ${resourceUri} result:`, JSON.parse(result.contents[0].text));
  } catch (error) {
    console.error(`Error reading resource ${resourceUri}:`, error);
  }
}

async function testTool(client, toolName, params) {
  try {
    const result = await client.callTool(toolName, params);
    console.log(`Tool ${toolName} result:`, result);
  } catch (error) {
    console.error(`Error calling tool ${toolName}:`, error);
  }
}

async function main() {
  const serverPath = process.argv[2] || "./dist/index.js";
  const command = process.argv[3] || "list";
  const param = process.argv[4] || "";
  const jsonParams = process.argv[5] ? JSON.parse(process.argv[5]) : {};
  
  const process = spawn("node", [serverPath]);
  const transport = new StdioClientTransport({
    input: process.stdout,
    output: process.stdin
  });
  
  const client = new Client(new Implementation("test-client", "1.0.0"));
  await client.connect(transport);
  
  switch (command) {
    case "list":
      const resources = await client.listResources();
      console.log("Resources:", resources?.resources?.map(r => r.uri) || []);
      const tools = await client.listTools();
      console.log("Tools:", tools?.tools?.map(t => t.name) || []);
      break;
    case "resource":
      await testResource(client, param);
      break;
    case "tool":
      await testTool(client, param, jsonParams);
      break;
    default:
      console.log("Unknown command");
  }
  
  await client.close();
  process.kill();
}

main();
```

### 4. Chạy test client

```bash
# Liệt kê tất cả resources và tools
node client.js

# Test một resource cụ thể
node client.js ./dist/index.js resource "jira://issues"

# Test một tool cụ thể với tham số
node client.js ./dist/index.js tool "createIssue" '{"projectKey":"DEMO","summary":"Test issue"}'
```

Client test này sẽ giúp bạn kiểm tra nhanh các thay đổi trong MCP server trước khi test với Cline, đặc biệt là khi bạn đang chuẩn hóa metadata và bổ sung schema cho các resource.