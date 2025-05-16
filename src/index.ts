import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';
import { registerAllResources } from './resources/index.js';
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

// Track registered resources for logging
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

// Create a context-aware server proxy for resources
const serverProxy = new Proxy(server, {
  get(target, prop) {
    if (prop === 'resource') {
      // Override the resource method to inject context
      return (name: string, pattern: any, handler: any) => {
        try {
          // Extract pattern for logging
          let patternStr = 'unknown-pattern';
          
          if (typeof pattern === 'string') {
            patternStr = pattern;
          } else if (pattern && typeof pattern === 'object') {
            if ('pattern' in pattern) {
              patternStr = pattern.pattern;
            }
          }
          
          // Track registered resources for logging purposes only
          registeredResources.push({ name, pattern: patternStr });
          
          // Create a context-aware handler wrapper
          const contextAwareHandler = async (uri: any, params: any, extra: any) => {
            try {
              // Ensure extra has context
              if (!extra) extra = {};
              if (!extra.context) extra.context = {};
              
              // Add Atlassian config to context
              extra.context.atlassianConfig = atlassianConfig;
              
              // Call the original handler with the enriched context
              return await handler(uri, params, extra);
            } catch (error) {
              logger.error(`Error in resource handler for ${name}:`, error);
              throw error;
            }
          };
          
          // Register the resource with the context-aware handler
          return target.resource(name, pattern, contextAwareHandler);
        } catch (error) {
          logger.error(`Error registering resource: ${error}`);
          throw error;
        }
      };
    }
    return Reflect.get(target, prop);
  }
});

// Log config info for debugging
logger.info(`Atlassian config available: ${JSON.stringify(atlassianConfig, null, 2)}`);

// Tool server proxy for consistent handling
const toolServerProxy: any = {
  tool: (name: string, description: string, schema: any, handler: any) => {
    // Register tool with a context-aware handler wrapper
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
  }
};

// Register all tools
logger.info('Registering all MCP Tools...');
registerAllTools(toolServerProxy);

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
    // Liệt kê tất cả các tool đã đăng ký
    logger.info('- Jira issue tools: createIssue, updateIssue, transitionIssue, assignIssue');
    logger.info('- Jira filter tools: createFilter, updateFilter, deleteFilter');
    logger.info('- Jira sprint tools: createSprint, startSprint, closeSprint, addIssueToSprint');
    logger.info('- Jira board tools: addIssueToBoard, configureBoardColumns');
    logger.info('- Jira backlog tools: addIssuesToBacklog, rankBacklogIssues');
    logger.info('- Jira dashboard tools: createDashboard, updateDashboard, addGadgetToDashboard, removeGadgetFromDashboard');
    logger.info('- Confluence tools: createPage, updatePage, addComment, addLabelsToPage, removeLabelsFromPage');
    
    // Resources - dynamically list all registered resources
    logger.info('Registered resources:');
    
    if (registeredResources.length === 0) {
      logger.info('No resources registered');
    } else {
      // Group by pattern and name to improve readability
      const resourcesByPattern = new Map<string, string[]>();
      
      registeredResources.forEach(res => {
        if (!resourcesByPattern.has(res.pattern)) {
          resourcesByPattern.set(res.pattern, []);
        }
        resourcesByPattern.get(res.pattern)!.push(res.name);
      });
      
      // Log each pattern with its resource names
      Array.from(resourcesByPattern.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([pattern, names]) => {
          logger.info(`- ${pattern} (${names.join(', ')})`);
        });
    }
  } catch (error) {
    logger.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Start server
startServer(); 