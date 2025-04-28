import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerCreateIssueTool } from './tools/jira/create-issue.js';
import { registerUpdateIssueTool } from './tools/jira/update-issue.js';
import { registerTransitionIssueTool } from './tools/jira/transition-issue.js';
import { registerAssignIssueTool } from './tools/jira/assign-issue.js';
import { registerCreatePageTool } from './tools/confluence/create-page.js';
import { registerAddCommentTool } from './tools/confluence/add-comment.js';
import { registerAllResources } from './resources/index.js';
import { Logger } from './utils/logger.js';
import { AtlassianConfig } from './utils/atlassian-api.js';
import { registerJiraResources } from './resources/jira/index.js';

// Tải biến môi trường
dotenv.config();

// Khởi tạo logger
const logger = Logger.getLogger('MCP:Server');

// Lấy cấu hình Atlassian từ biến môi trường
const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME;
const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL;
const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN;

if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
  logger.error('Missing Atlassian credentials in environment variables');
  process.exit(1);
}

// Tạo cấu hình Atlassian
const atlassianConfig: AtlassianConfig = {
  baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
    ? `https://${ATLASSIAN_SITE_NAME}` 
    : ATLASSIAN_SITE_NAME,
  email: ATLASSIAN_USER_EMAIL,
  apiToken: ATLASSIAN_API_TOKEN
};

logger.info('Initializing MCP Atlassian Server...');

// Khởi tạo MCP server với capabilities
const server = new McpServer({
  name: process.env.MCP_SERVER_NAME || 'mcp-atlassian-integration',
  version: process.env.MCP_SERVER_VERSION || '1.0.0',
  capabilities: {
    resources: {},  // Khai báo hỗ trợ resources capability
    tools: {}
  }
});

// Log thông tin cấu hình để debug
logger.info(`Atlassian config available: ${JSON.stringify(atlassianConfig, null, 2)}`);

// Định nghĩa một hàm wrapper mới để xử lý context
const wrapToolHandler = (registerToolFn: (server: McpServer) => void) => {
  // Tạo một server proxy để bắt lệnh đăng ký
  const proxyServer: any = {
    tool: (name: string, description: string, schema: any, handler: any) => {
      // Đăng ký lại tool với handler mới xử lý context
      server.tool(name, description, schema, async (params: any, context: any) => {
        // Context được cung cấp trực tiếp cho handler
        context.atlassianConfig = atlassianConfig;
        
        logger.debug(`Tool ${name} called with context keys: [${Object.keys(context)}]`);
        
        try {
          return await handler(params, context);
        } catch (error) {
          logger.error(`Error in wrapped handler for ${name}:`, error);
          return {
            content: [{ type: 'text', text: `Error in tool handler: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true
          };
        }
      });
    }
  };
  
  // Gọi hàm đăng ký với server proxy
  registerToolFn(proxyServer);
};

// Đăng ký tất cả các tools với wrapper
// Jira tools
wrapToolHandler(registerCreateIssueTool);
wrapToolHandler(registerUpdateIssueTool);
wrapToolHandler(registerTransitionIssueTool);
wrapToolHandler(registerAssignIssueTool);

// Confluence tools
wrapToolHandler(registerCreatePageTool);
wrapToolHandler(registerAddCommentTool);

// Đăng ký tất cả resources
logger.info('Registering MCP Resources...');
// registerAllResources(server); // Đã bao gồm registerJiraResources bên trong, tránh trùng lặp
registerJiraResources(server);

// Khởi động server dựa trên loại transport được cấu hình
async function startServer() {
  try {
    // Luôn sử dụng STDIO transport cho độ tin cậy cao nhất
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    logger.info('MCP Atlassian Server started with STDIO transport');

    // In thông tin khởi động
    logger.info(`MCP Server Name: ${process.env.MCP_SERVER_NAME || 'mcp-atlassian-integration'}`);
    logger.info(`MCP Server Version: ${process.env.MCP_SERVER_VERSION || '1.0.0'}`);
    logger.info(`Connected to Atlassian site: ${ATLASSIAN_SITE_NAME}`);
    logger.info('Registered tools:');

    // Jira tools
    logger.info('- createIssue (Jira)');
    logger.info('- updateIssue (Jira)');
    logger.info('- transitionIssue (Jira)');
    logger.info('- assignIssue (Jira)');

    // Confluence tools
    logger.info('- createPage (Confluence)');
    logger.info('- addComment (Confluence)');
    
    // Resources
    logger.info('Registered resources:');
    logger.info('- jira://projects');
    logger.info('- jira://projects/{projectKey}');
  } catch (error) {
    logger.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Khởi động server
startServer(); 