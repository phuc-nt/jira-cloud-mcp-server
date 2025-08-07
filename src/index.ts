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

// Create server wrapper with context injection
const serverWithContext = {
  tool: (name: string, description: string, schema: any, handler: any) => {
    server.tool(name, description, schema, async (params: any, context: any) => {
      context.atlassianConfig = atlassianConfig;
      return await handler(params, context);
    });
  }
};

// Register all tools with context injection
logger.info('Registering all MCP Tools...');
registerAllTools(serverWithContext);

// Start server with simplified initialization
async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.info(`MCP Jira Server v3.0.0 started successfully`);
    logger.info(`Connected to: ${ATLASSIAN_SITE_NAME}`);
    logger.info(`Architecture: Tools-only (18+ Jira tools registered)`);
  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer(); 