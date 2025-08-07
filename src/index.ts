import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';
import { Logger } from './utils/logger.js';
import { AtlassianConfig } from './utils/atlassian-api-base.js';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = Logger.getLogger('MCP:Server');

// Get Atlassian config from environment variables
const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME;
const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL;
const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN;

if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
  logger.error('Missing Atlassian credentials in environment variables');
  process.exit(1);
}

// Create Atlassian config
const atlassianConfig: AtlassianConfig = {
  baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
    ? `https://${ATLASSIAN_SITE_NAME}` 
    : ATLASSIAN_SITE_NAME,
  email: ATLASSIAN_USER_EMAIL,
  apiToken: ATLASSIAN_API_TOKEN
};

logger.info('Initializing MCP Atlassian Server...');

// Initialize MCP server with capabilities (tools-only)
const server = new McpServer({
  name: process.env.MCP_SERVER_NAME || 'phuc-nt/mcp-atlassian-server',
  version: process.env.MCP_SERVER_VERSION || '1.0.0',
  capabilities: {
    tools: {}  // Only tools capability - no resources
  }
});

// Log config info for debugging
logger.info(`Atlassian config available: ${JSON.stringify(atlassianConfig, null, 2)}`);

// Create simplified tool registration with context injection
const registerToolWithContext = (name: string, description: string, schema: any, handler: any) => {
  server.tool(name, description, schema, async (params: any, context: any) => {
    // Add Atlassian config to context
    context.atlassianConfig = atlassianConfig;
    
    logger.debug(`Tool ${name} called with context keys: [${Object.keys(context)}]`);
    
    try {
      return await handler(params, context);
    } catch (error) {
      logger.error(`Error in tool handler for ${name}:`, error);
      return {
        content: [{ type: 'text', text: `Error in tool handler: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });
};

// Create simple server proxy for tools registration
const toolServerProxy: any = {
  tool: registerToolWithContext
};

// Register all tools (no resources in tools-only architecture)
logger.info('Registering all MCP Tools...');
registerAllTools(toolServerProxy);

// Start the server based on configured transport type
async function startServer() {
  try {
    // Always use STDIO transport for highest reliability
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    logger.info('MCP Atlassian Server started with STDIO transport');
    
    // Print startup info
    logger.info(`MCP Server Name: ${process.env.MCP_SERVER_NAME || 'phuc-nt/mcp-atlassian-server'}`);
    logger.info(`MCP Server Version: ${process.env.MCP_SERVER_VERSION || '1.0.0'}`);
    logger.info(`Connected to Atlassian site: ${ATLASSIAN_SITE_NAME}`);
    
    logger.info('Registered tools:');
    // Liệt kê tất cả các tool đã đăng ký
    logger.info('- Jira issue tools: createIssue, updateIssue, transitionIssue, assignIssue');
    logger.info('- Jira filter tools: createFilter, updateFilter, deleteFilter');
    logger.info('- Jira sprint tools: createSprint, startSprint, closeSprint, addIssueToSprint');
    logger.info('- Jira board tools: addIssueToBoard, configureBoardColumns');
    logger.info('- Jira backlog tools: addIssuesToBacklog, rankBacklogIssues');
    logger.info('- Jira dashboard tools: createDashboard, updateDashboard, addGadgetToDashboard, removeGadgetFromDashboard');
    
    // Tools-only architecture - no resources
    logger.info('Architecture: Tools-only (resources removed)');
  } catch (error) {
    logger.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Start server
startServer(); 