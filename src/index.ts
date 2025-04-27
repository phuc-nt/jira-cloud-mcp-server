import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGetIssueTool } from './tools/jira/get-issue.js';
import { registerSearchIssuesTool } from './tools/jira/search-issues.js';
import { registerCreateIssueTool } from './tools/jira/create-issue.js';
import { registerUpdateIssueTool } from './tools/jira/update-issue.js';
import { registerTransitionIssueTool } from './tools/jira/transition-issue.js';
import { registerAssignIssueTool } from './tools/jira/assign-issue.js';
import { registerCreatePageTool } from './tools/confluence/create-page.js';
import { registerGetPageTool } from './tools/confluence/get-page.js';
import { registerSearchPagesTool } from './tools/confluence/search-pages.js';
import { registerUpdatePageTool } from './tools/confluence/update-page.js';
import { registerGetSpacesTool } from './tools/confluence/get-spaces.js';
import { registerAddCommentTool } from './tools/confluence/add-comment.js';
import { Logger } from './utils/logger.js';
import { AtlassianConfig } from './utils/atlassian-api.js';

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

// Khởi tạo MCP server
const server = new McpServer({
  name: process.env.MCP_SERVER_NAME || 'mcp-atlassian-integration',
  version: process.env.MCP_SERVER_VERSION || '1.0.0'
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
        logger.debug(`Tool ${name} called with context keys: [${Object.keys(context)}]`);
        
        // Kiểm tra context hiện có
        if (typeof context === 'object') {
          // Thử debug để xem context có phương thức gì
          logger.debug(`Context methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(context))}`);
        }
        
        // Truyền cấu hình vào trực tiếp thay vì qua context
        if (handler.length === 2) { // Nếu handler chấp nhận 2 tham số (params và context)
          try {
            // Giả lập context dạng object đơn giản
            const simpleContext = {
              atlassianConfig: atlassianConfig,
              // Thêm các phương thức của context nếu cần
              get: (key: string) => key === 'atlassianConfig' ? atlassianConfig : undefined,
              set: (key: string, value: any) => { /* implement if needed */ }
            };
            
            return await handler(params, simpleContext);
          } catch (error) {
            logger.error(`Error in wrapped handler for ${name}:`, error);
            return {
              content: [{ type: 'text', text: `Error in tool handler: ${error instanceof Error ? error.message : String(error)}` }],
              isError: true
            };
          }
        } else {
          logger.error(`Handler for ${name} does not accept expected parameters`);
          return {
            content: [{ type: 'text', text: 'Internal server error: invalid handler' }],
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
wrapToolHandler(registerGetIssueTool);
wrapToolHandler(registerSearchIssuesTool);
wrapToolHandler(registerCreateIssueTool);
wrapToolHandler(registerUpdateIssueTool);
wrapToolHandler(registerTransitionIssueTool);
wrapToolHandler(registerAssignIssueTool);

// Confluence tools
wrapToolHandler(registerCreatePageTool);
wrapToolHandler(registerGetPageTool);
wrapToolHandler(registerSearchPagesTool);
wrapToolHandler(registerUpdatePageTool);
wrapToolHandler(registerGetSpacesTool);
wrapToolHandler(registerAddCommentTool);

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
    logger.info('- getIssue (Jira)');
    logger.info('- searchIssues (Jira)');
    logger.info('- createIssue (Jira)');
    logger.info('- updateIssue (Jira)');
    logger.info('- transitionIssue (Jira)');
    logger.info('- assignIssue (Jira)');

    // Confluence tools
    logger.info('- createPage (Confluence)');
    logger.info('- getPage (Confluence)');
    logger.info('- searchPages (Confluence)');
    logger.info('- updatePage (Confluence)');
    logger.info('- getSpaces (Confluence)');
    logger.info('- addComment (Confluence)');
  } catch (error) {
    logger.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Khởi động server
startServer(); 