import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerIssueResources } from './issues.js';
import { registerProjectResources } from './projects.js';
import { registerUserResources } from './users.js';
import { Logger } from '../../utils/logger.js';

const logger = Logger.getLogger('JiraResources');

/**
 * Register all Jira resources with MCP Server
 * @param server MCP Server instance
 */
export function registerJiraResources(server: McpServer) {
  logger.info('Registering Jira resources...');
  
  // Register specific Jira resources
  registerIssueResources(server);
  registerProjectResources(server);
  registerUserResources(server);
  
  logger.info('Jira resources registered successfully');
}
