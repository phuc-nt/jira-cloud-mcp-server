import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryClientServerPair } from '@modelcontextprotocol/sdk/server/memory.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { registerGetIssueTool } from '../../tools/jira/get-issue.js';
import { registerSearchIssuesTool } from '../../tools/jira/search-issues.js';
import { registerGetPageTool } from '../../tools/confluence/get-page.js';
import { registerGetSpacesTool } from '../../tools/confluence/get-spaces.js';
import dotenv from 'dotenv';

// Tải biến môi trường
dotenv.config();

describe('MCP Server E2E Tests', () => {
  let server: McpServer;
  let client: McpClient;
  let testConfig: AtlassianConfig;

  beforeEach(() => {
    // Thiết lập cấu hình test từ biến môi trường
    const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || 'test-site';
    const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || 'test@example.com';
    const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || 'test-token';

    testConfig = {
      baseUrl: `https://${ATLASSIAN_SITE_NAME}.atlassian.net`,
      email: ATLASSIAN_USER_EMAIL,
      apiToken: ATLASSIAN_API_TOKEN
    };

    // Tạo cặp server-client cho test
    const pair = new InMemoryClientServerPair();
    server = new McpServer({
      name: 'mcp-atlassian-test-server',
      version: '1.0.0'
    });
    client = new McpClient();

    // Kết nối server và client
    server.connect(pair.serverTransport);
    client.connect(pair.clientTransport);

    // Đăng ký context cho mỗi tool handler
    const context = new Map<string, any>();
    context.set('atlassianConfig', testConfig);
    
    // Đăng ký một số tools để test
    registerGetIssueTool(server);
    registerSearchIssuesTool(server);
    registerGetPageTool(server);
    registerGetSpacesTool(server);
  });

  afterEach(() => {
    // Đóng kết nối sau mỗi test
    server.close();
    client.close();
  });

  test('Server should register tools correctly', async () => {
    // Lấy danh sách tools đã đăng ký
    const tools = await client.getToolList();
    
    // Kiểm tra số lượng tools đã đăng ký
    expect(tools.length).toBeGreaterThan(0);
    
    // Kiểm tra các tools cụ thể
    const toolNames = tools.map(tool => tool.name);
    expect(toolNames).toContain('getIssue');
    expect(toolNames).toContain('searchIssues');
    expect(toolNames).toContain('getPage');
    expect(toolNames).toContain('getSpaces');
  });

  // Thêm các test case cho tool calls sẽ được bổ sung sau
  // khi hoàn thiện việc cập nhật API các tools
  
  test.todo('Should call getIssue tool successfully');
  test.todo('Should call searchIssues tool successfully');
  test.todo('Should handle error cases properly');
}); 