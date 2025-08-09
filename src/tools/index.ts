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
import { registerGetIssueTransitionsTool } from './jira/get-issue-transitions.js';
import { registerGetIssueCommentsTool } from './jira/get-issue-comments.js';
import { registerAddIssueCommentTool } from './jira/add-issue-comment.js';
import { registerUpdateIssueCommentTool } from './jira/update-issue-comment.js';
import { registerListBoardsTool } from './jira/list-boards.js';
import { registerGetBoardTool } from './jira/get-board.js';
import { registerGetBoardIssuesTool } from './jira/get-board-issues.js';
import { registerGetBoardConfigurationTool } from './jira/get-board-configuration.js';
import { registerGetBoardSprintsTool } from './jira/get-board-sprints.js';
import { registerListSprintsTool } from './jira/list-sprints.js';
import { registerGetSprintTool } from './jira/get-sprint.js';
import { registerGetSprintIssuesTool } from './jira/get-sprint-issues.js';
import { registerListFiltersTool } from './jira/list-filters.js';
import { registerGetFilterTool } from './jira/get-filter.js';
import { registerGetMyFiltersTool } from './jira/get-my-filters.js';
import { registerListDashboardsTool } from './jira/list-dashboards.js';
import { registerGetDashboardTool } from './jira/get-dashboard.js';
import { registerGetDashboardGadgetsTool } from './jira/get-dashboard-gadgets.js';
import { registerListUsersTool } from './jira/list-users.js';
import { registerGetAssignableUsersTool } from './jira/get-assignable-users.js';
import { registerDeleteIssueTool } from './jira/delete-issue.js';
import { registerListBacklogIssuesTool } from './jira/list-backlog-issues.js';
// Fix Version Management Tools (Sprint 4.4)
import { registerCreateFixVersionTool } from './jira/create-fix-version.js';
import { registerListProjectVersionsTool } from './jira/list-project-versions.js';
import { registerGetProjectVersionTool } from './jira/get-project-version.js';
import { registerUpdateFixVersionTool } from './jira/update-fix-version.js';

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
  registerGetIssueTransitionsTool(server);
  registerGetIssueCommentsTool(server);
  
  // Issue management tools (write operations)
  registerCreateIssueTool(server);
  registerUpdateIssueTool(server);
  registerTransitionIssueTool(server);
  registerAssignIssueTool(server);
  registerAddIssueCommentTool(server);
  registerUpdateIssueCommentTool(server);
  registerDeleteIssueTool(server);  // Added: Delete issue functionality
  
  // Project management tools
  registerListProjectsTool(server);
  registerGetProjectTool(server);
  
  // User management tools
  registerGetUserTool(server);
  registerSearchUsersTool(server);
  registerListUsersTool(server);
  registerGetAssignableUsersTool(server);
  
  // Board management tools (read operations)
  registerListBoardsTool(server);
  registerGetBoardTool(server);
  registerGetBoardIssuesTool(server);
  registerGetBoardConfigurationTool(server);
  registerGetBoardSprintsTool(server);
  registerListBacklogIssuesTool(server);  // Added: List backlog issues functionality
  
  // Sprint management tools (read operations)
  registerListSprintsTool(server);
  registerGetSprintTool(server);
  registerGetSprintIssuesTool(server);
  
  // Filter management tools (read operations)
  registerListFiltersTool(server);
  registerGetFilterTool(server);
  registerGetMyFiltersTool(server);
  
  // Dashboard management tools (read operations)
  registerListDashboardsTool(server);
  registerGetDashboardTool(server);
  registerGetDashboardGadgetsTool(server);
  
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

  // Fix Version Management Tools (Sprint 4.4)
  registerCreateFixVersionTool(server);
  registerListProjectVersionsTool(server);
  registerGetProjectVersionTool(server);
  registerUpdateFixVersionTool(server);
}
