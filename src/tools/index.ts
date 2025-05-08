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
import { registerAddLabelsTool, registerRemoveLabelsTool } from './confluence/label-page.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

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
  
  // Confluence tools
  registerCreatePageTool(server);
  registerUpdatePageTool(server);
  registerAddCommentTool(server);
  registerAddLabelsTool(server);
  registerRemoveLabelsTool(server);
}
