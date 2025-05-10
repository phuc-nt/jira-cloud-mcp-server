import { registerCreateIssueTool } from './jira/create-issue.js';
import { registerUpdateIssueTool } from './jira/update-issue.js';
import { registerTransitionIssueTool } from './jira/transition-issue.js';
import { registerAssignIssueTool } from './jira/assign-issue.js';
import { registerCreateFilterTool } from './jira/create-filter.js';
import { registerUpdateFilterTool } from './jira/update-filter.js';
import { registerDeleteFilterTool } from './jira/delete-filter.js';
import { registerCreateSprintTool } from './jira/create-sprint.js';
import { registerCreatePageTool } from './confluence/create-page.js';
import { registerUpdatePageTool } from './confluence/update-page.js';
import { registerAddCommentTool } from './confluence/add-comment.js';
import { registerDeletePageTool } from './confluence/delete-page.js';
import { registerUpdatePageTitleTool } from './confluence/update-page-title.js';
import { registerUpdateFooterCommentTool } from './confluence/update-footer-comment.js';
import { registerDeleteFooterCommentTool } from './confluence/delete-footer-comment.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStartSprintTool } from './jira/start-sprint.js';
import { registerCloseSprintTool } from './jira/close-sprint.js';
import { registerAddIssuesToBacklogTool } from './jira/add-issues-to-backlog.js';
import { registerRankBacklogIssuesTool } from './jira/rank-backlog-issues.js';
import { registerCreateDashboardTool } from './jira/create-dashboard.js';
import { registerUpdateDashboardTool } from './jira/update-dashboard.js';
import { registerAddGadgetToDashboardTool } from './jira/add-gadget-to-dashboard.js';
import { registerRemoveGadgetFromDashboardTool } from './jira/remove-gadget-from-dashboard.js';
import { registerAddIssueToSprintTool } from './jira/add-issue-to-sprint.js';

/**
 * Register all tools with MCP Server
 * @param server MCP Server instance
 */
export function registerAllTools(server: McpServer) {
  // Jira issue tools
  registerCreateIssueTool(server);
  registerUpdateIssueTool(server);
  registerTransitionIssueTool(server);
  registerAssignIssueTool(server);
  
  // Jira filter tools
  registerCreateFilterTool(server);
  registerUpdateFilterTool(server);
  registerDeleteFilterTool(server);
  
  // Jira sprint tools
  registerCreateSprintTool(server);
  registerStartSprintTool(server);
  registerCloseSprintTool(server);
  
  // Jira board tools
  // registerAddIssueToBoardTool(server);
  
  // Jira backlog tools
  registerAddIssuesToBacklogTool(server);
  registerRankBacklogIssuesTool(server);
  
  // Jira dashboard/gadget tools
  registerCreateDashboardTool(server);
  registerUpdateDashboardTool(server);
  registerAddGadgetToDashboardTool(server);
  registerRemoveGadgetFromDashboardTool(server);
  
  // Confluence tools
  registerCreatePageTool(server);
  registerUpdatePageTool(server);
  registerAddCommentTool(server);
  registerDeletePageTool(server);
  registerUpdatePageTitleTool(server);
  registerUpdateFooterCommentTool(server);
  registerDeleteFooterCommentTool(server);

  registerAddIssueToSprintTool(server);
}
