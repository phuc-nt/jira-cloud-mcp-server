import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSpaceResources } from './spaces.js';
import { registerPageResources } from './pages.js';
import { registerContentMetadataResources } from './content-metadata.js';
import { Logger } from '../../utils/logger.js';

const logger = Logger.getLogger('ConfluenceResources');

/**
 * Register all Confluence resources with MCP Server
 * @param server MCP Server instance
 */
export function registerConfluenceResources(server: McpServer) {
  logger.info('Registering Confluence resources...');
  
  // Register specific Confluence resources
  registerSpaceResources(server);
  registerPageResources(server);
  registerContentMetadataResources(server);
  
  logger.info('Confluence resources registered successfully');
}
