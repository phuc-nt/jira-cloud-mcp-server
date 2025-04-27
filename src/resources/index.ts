import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerJiraResources } from './jira/index.js';
import { registerConfluenceResources } from './confluence/index.js';
import { Logger } from '../utils/logger.js';

const logger = Logger.getLogger('MCPResources');

/**
 * Đăng ký tất cả resources (Jira và Confluence) với MCP Server
 * @param server MCP Server instance
 */
export function registerAllResources(server: McpServer) {
  logger.info('Registering all MCP resources...');
  
  // Đăng ký tất cả resources của Jira
  registerJiraResources(server);
  
  // Đăng ký tất cả resources của Confluence
  registerConfluenceResources(server);
  
  logger.info('All MCP resources registered successfully');
}
