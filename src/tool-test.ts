import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerCreateIssueTool } from './tools/jira/create-issue.js';
import { registerUpdateIssueTool } from './tools/jira/update-issue.js';
import { registerTransitionIssueTool } from './tools/jira/transition-issue.js';
import { registerAssignIssueTool } from './tools/jira/assign-issue.js';
import { registerCreatePageTool } from './tools/confluence/create-page.js';
import { registerAddCommentTool } from './tools/confluence/add-comment.js';
import { registerUpdatePageTool } from './tools/confluence/update-page.js';
import { registerAllResources } from './resources/index.js';
import { Logger } from './utils/logger.js';
import { AtlassianConfig } from './utils/atlassian-api.js';
import { registerJiraResources } from './resources/jira/index.js';

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

// Keep track of all registered resources with name and pattern
const registeredResources: Array<{ name: string; pattern: string }> = [];

// Initialize MCP server with capabilities
const server = new McpServer({
  name: process.env.MCP_SERVER_NAME || 'phuc-nt/mcp-atlassian-server',
  version: process.env.MCP_SERVER_VERSION || '1.0.0',
  capabilities: {
    resources: {},  // Declare support for resources capability
    tools: {}
  }
});

// Create a proxy to track registered resources
const serverProxy = new Proxy(server, {
  get(target, prop) {
    if (prop === 'resource') {
      // Override the resource method to track registrations
      return (name: string, pattern: any, handler: any) => {
        // Debug log to see exactly what we're receiving
        logger.debug(`Registering resource with pattern type: ${typeof pattern}, value: ${JSON.stringify(pattern)}`);
        
        try {
          // Extract pattern based on type
          let patternStr = 'unknown-pattern';
          
          if (typeof pattern === 'string') {
            patternStr = pattern;
          } else if (pattern && typeof pattern === 'object') {
            if ('pattern' in pattern) {
              patternStr = pattern.pattern;
              logger.debug(`Found pattern in object: ${patternStr}`);
            } else {
              // Log all properties to help identify the structure
              logger.debug(`Object properties: ${Object.keys(pattern).join(', ')}`);
            }
          }
          
          // Store both name and pattern
          registeredResources.push({ name, pattern: patternStr });
          
          // Call the original method
          return target.resource(name, pattern, handler);
        } catch (error) {
          logger.error(`Error registering resource: ${error}`);
          return target.resource(name, pattern, handler);
        }
      };
    }
    return Reflect.get(target, prop);
  }
});

// Log config info for debugging
logger.info(`Atlassian config available: ${JSON.stringify(atlassianConfig, null, 2)}`);

// Define a wrapper function to handle context
const wrapToolHandler = (registerToolFn: (server: McpServer) => void) => {
  // Create a server proxy to intercept tool registration
  const proxyServer: any = {
    tool: (name: string, description: string, schema: any, handler: any) => {
      // Re-register tool with new handler that handles context
      server.tool(name, description, schema, async (params: any, context: any) => {
        // Context is provided directly to the handler
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
  
  // Call the registration function with the proxy server
  registerToolFn(proxyServer);
};

// Register all tools with wrapper
// Jira tools
wrapToolHandler(registerCreateIssueTool);
wrapToolHandler(registerUpdateIssueTool);
wrapToolHandler(registerTransitionIssueTool);
wrapToolHandler(registerAssignIssueTool);

// Confluence tools
wrapToolHandler(registerCreatePageTool);
wrapToolHandler(registerAddCommentTool);
wrapToolHandler(registerUpdatePageTool);

// Register all resources
logger.info('Registering MCP Resources...');
registerAllResources(serverProxy);

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
    // Jira tools
    logger.info('- createIssue (Jira)');
    logger.info('- updateIssue (Jira)');
    logger.info('- transitionIssue (Jira)');
    logger.info('- assignIssue (Jira)');
    // Confluence tools
    logger.info('- createPage (Confluence)');
    logger.info('- addComment (Confluence)');
    logger.info('- updatePage (Confluence)');
    // Resources - dynamically list all registered resources
    logger.info('Registered resources:');
    
    if (registeredResources.length === 0) {
      logger.info('No resources registered');
    } else {
      // Group by name to improve readability
      const uniquePatterns = new Set<string>();
      registeredResources.forEach(res => {
        uniquePatterns.add(res.pattern);
      });
      
      Array.from(uniquePatterns).sort().forEach(pattern => {
        logger.info(`- ${pattern}`);
      });
    }
  } catch (error) {
    logger.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Start server
startServer(); 