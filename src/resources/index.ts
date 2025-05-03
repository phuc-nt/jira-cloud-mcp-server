import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerJiraResources } from './jira/index.js';
import { registerConfluenceResources } from './confluence/index.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getLogger('MCPResources');

/**
 * Register all resources (Jira and Confluence) with MCP Server
 * @param server MCP Server instance
 */
export function registerAllResources(server: McpServer) {
  logger.info('Registering all MCP resources...');
  
  // Register all Jira resources
  registerJiraResources(server);
  
  // Register all Confluence resources
  registerConfluenceResources(server);
  
  logger.info('All MCP resources registered successfully');
}
