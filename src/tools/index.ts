import { registerCreateIssueTool } from './jira/create-issue.js';
import { registerUpdateIssueTool } from './jira/update-issue.js';
import { registerTransitionIssueTool } from './jira/transition-issue.js';
import { registerAssignIssueTool } from './jira/assign-issue.js';
import { registerCreatePageTool } from './confluence/create-page.js';
import { registerUpdatePageTool } from './confluence/update-page.js';
import { registerAddCommentTool } from './confluence/add-comment.js';

/**
 * Register all tools with MCP Server
 * @param server MCP Server instance
 */
export function registerAllTools(server: any) {
  registerCreateIssueTool(server);
  registerUpdateIssueTool(server);
  registerTransitionIssueTool(server);
  registerAssignIssueTool(server);
  registerCreatePageTool(server);
  registerUpdatePageTool(server);
  registerAddCommentTool(server);
}
