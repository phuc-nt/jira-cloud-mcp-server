import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSpaceResources } from './spaces.js';
import { registerPageResources } from './pages.js';
import { Logger } from '../../utils/logger.js';

const logger = Logger.getLogger('ConfluenceResources');

/**
 * Đăng ký tất cả Confluence resources với MCP Server
 * @param server MCP Server instance
 */
export function registerConfluenceResources(server: McpServer) {
  logger.info('Registering Confluence resources...');
  
  // Đăng ký resources cụ thể của Confluence
  registerSpaceResources(server);
  registerPageResources(server);
  
  logger.info('Confluence resources registered successfully');
}
