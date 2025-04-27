import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';

const logger = Logger.getLogger('JiraResource:Users');

/**
 * Đăng ký các resources liên quan đến Jira users
 * @param server MCP Server instance
 */
export function registerUserResources(server: McpServer) {
  logger.info('Registering Jira user resources... (not implemented yet)');
  
  // Placeholder cho các user resources, sẽ triển khai sau
}
