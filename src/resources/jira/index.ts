import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerIssueResources } from './issues.js';
import { registerProjectResources } from './projects.js';
import { registerUserResources } from './users.js';
import { registerFilterResources } from './filters.js';
import { registerBoardResources } from './boards.js';
import { registerSprintResources } from './sprints.js';
import { registerDashboardResources } from './dashboards.js';
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
  registerFilterResources(server);
  registerBoardResources(server);
  registerSprintResources(server);
  registerDashboardResources(server);
  
  logger.info('Jira resources registered successfully');
}
