import { registerCreateIssueTool } from './jira/create-issue.js';
import { registerUpdateIssueTool } from './jira/update-issue.js';
import { registerTransitionIssueTool } from './jira/transition-issue.js';
import { registerAssignIssueTool } from './jira/assign-issue.js';
import { registerCreateFilterTool } from './jira/create-filter.js';
import { registerUpdateFilterTool } from './jira/update-filter.js';
import { registerDeleteFilterTool } from './jira/delete-filter.js';
import { registerCreateSprintTool } from './jira/create-sprint.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig } from '../utils/atlassian-api-base.js';
import { registerStartSprintTool } from './jira/start-sprint.js';
import { registerCloseSprintTool } from './jira/close-sprint.js';
import { registerAddIssuesToBacklogTool } from './jira/add-issues-to-backlog.js';
import { registerRankBacklogIssuesTool } from './jira/rank-backlog-issues.js';
import { registerCreateDashboardTool } from './jira/create-dashboard.js';
import { registerUpdateDashboardTool } from './jira/update-dashboard.js';
import { registerAddGadgetToDashboardTool } from './jira/add-gadget-to-dashboard.js';
import { registerRemoveGadgetFromDashboardTool } from './jira/remove-gadget-from-dashboard.js';
import { registerAddIssueToSprintTool } from './jira/add-issue-to-sprint.js';
import { registerGetJiraGadgetsTool } from './jira/get-gadgets-new.js';
import { registerListIssuesTool } from './jira/list-issues.js';
import { registerGetIssueTool } from './jira/get-issue.js';
import { registerSearchIssuesTool } from './jira/search-issues.js';
import { registerListProjectsTool } from './jira/list-projects.js';
import { registerGetProjectTool } from './jira/get-project.js';
import { registerGetUserTool } from './jira/get-user.js';
import { registerSearchUsersTool } from './jira/search-users.js';

/**
 * Register all tools with MCP Server
 * @param server MCP Server instance (with context injection already applied)
 */
export function registerAllTools(server: any) {
  // Register all Jira tools
  
  // Issue management tools (read operations)
  registerListIssuesTool(server);
  registerGetIssueTool(server);
  registerSearchIssuesTool(server);
  
  // Issue management tools (write operations)
  registerCreateIssueTool(server);
  registerUpdateIssueTool(server);
  registerTransitionIssueTool(server);
  registerAssignIssueTool(server);
  
  // Project management tools
  registerListProjectsTool(server);
  registerGetProjectTool(server);
  
  // User management tools
  registerGetUserTool(server);
  registerSearchUsersTool(server);
  
  registerCreateFilterTool(server);
  registerUpdateFilterTool(server);
  registerDeleteFilterTool(server);
  
  registerCreateSprintTool(server);
  registerStartSprintTool(server);
  registerCloseSprintTool(server);
  registerAddIssueToSprintTool(server);
  
  registerAddIssuesToBacklogTool(server);
  registerRankBacklogIssuesTool(server);
  
  registerCreateDashboardTool(server);
  registerUpdateDashboardTool(server);
  registerAddGadgetToDashboardTool(server);
  registerRemoveGadgetFromDashboardTool(server);
  registerGetJiraGadgetsTool(server);
}
