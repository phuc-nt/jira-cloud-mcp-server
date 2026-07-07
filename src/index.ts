import dotenv from 'dotenv';
import { createRequire } from 'module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';
import { Logger } from './utils/logger.js';
import { AtlassianConfig } from './utils/atlassian-api-base.js';

// Read own package.json for serverInfo.version default (ESM-safe require)
const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { version: string };

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

// Initialize MCP server (tools-only). The SDK reads capabilities from the SECOND arg
// (ServerOptions), not the Implementation object; McpServer also auto-declares the tool
// capability the moment .tool() is registered, so this is explicit-but-redundant.
const server = new McpServer(
  {
    name: process.env.MCP_SERVER_NAME || 'phuc-nt/mcp-atlassian-server',
    version: process.env.MCP_SERVER_VERSION || packageJson.version,
  },
  {
    capabilities: { tools: {} },
  }
);

// Create server wrapper with context injection
const serverWithContext = {
  tool: (name: string, description: string, schema: any, handler: any) => {
    server.tool(name, description, schema, async (params: any, context: any) => {
      // Ensure context object exists before setting properties
      if (!context) {
        context = {};
      }
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

    // Exit cleanly when stdin closes (e.g. parent process pipe closed). The SDK
    // does not exit automatically on EOF, which can leave orphaned processes
    // under spawn-per-call usage.
    process.stdin.on('end', () => process.exit(0));

    logger.info(`MCP Jira Server v${packageJson.version} started successfully`);
    logger.info(`Connected to: ${ATLASSIAN_SITE_NAME}`);
    logger.info(`Architecture: Tools-only (18+ Jira tools registered)`);
  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer(); 