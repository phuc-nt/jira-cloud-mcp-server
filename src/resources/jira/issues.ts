import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';

const logger = Logger.getLogger('JiraResource:Issues');

/**
 * Đăng ký các resources liên quan đến Jira issues
 * @param server MCP Server instance
 */
export function registerIssueResources(server: McpServer) {
  logger.info('Registering Jira issue resources... (not implemented yet)');
  
  // Placeholder cho các issue resources, sẽ triển khai sau
}
