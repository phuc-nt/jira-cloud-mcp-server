/**
 * Core Module Tool Registration
 * 14 Essential CRUD Operations + Helper Tools
 */

// Issue CRUD operations
import { registerCreateIssueTool } from '../../../tools/jira/create-issue.js';
import { registerEnhancedUpdateIssueTool } from '../../../tools/jira/enhanced-update-issue.js';
import { registerDeleteIssueTool } from '../../../tools/jira/delete-issue.js';
import { registerTransitionIssueTool } from '../../../tools/jira/transition-issue.js';
import { registerAssignIssueTool } from '../../../tools/jira/assign-issue.js';

// Comment operations
import { registerAddIssueCommentTool } from '../../../tools/jira/add-issue-comment.js';
import { registerUpdateIssueCommentTool } from '../../../tools/jira/update-issue-comment.js';

// Filter management
import { registerCreateFilterTool } from '../../../tools/jira/create-filter.js';
import { registerUpdateFilterTool } from '../../../tools/jira/update-filter.js';
import { registerDeleteFilterTool } from '../../../tools/jira/delete-filter.js';

// Version management  
import { registerCreateFixVersionTool } from '../../../tools/jira/create-fix-version.js';
import { registerUpdateFixVersionTool } from '../../../tools/jira/update-fix-version.js';

// User and workflow helpers
import { registerGetAssignableUsersTool } from '../../../tools/jira/get-assignable-users.js';
import { registerGetIssueTransitionsTool } from '../../../tools/jira/get-issue-transitions.js';

export function registerCoreModuleTools(server: any) {
  // Issue CRUD Operations (5 tools)
  registerCreateIssueTool(server);           // 1. Create new issues
  registerEnhancedUpdateIssueTool(server);   // 2. Update issue fields  
  registerDeleteIssueTool(server);           // 3. Delete issues
  registerTransitionIssueTool(server);       // 4. Move issues through workflow
  registerAssignIssueTool(server);           // 5. Assign issues to users
  
  // Comment Operations (2 tools)
  registerAddIssueCommentTool(server);       // 6. Add comments to issues
  registerUpdateIssueCommentTool(server);    // 7. Edit existing comments
  
  // Filter Management (3 tools)
  registerCreateFilterTool(server);          // 8. Create saved JQL filters
  registerUpdateFilterTool(server);          // 9. Modify existing filters
  registerDeleteFilterTool(server);          // 10. Remove filters
  
  // Version Management (2 tools)
  registerCreateFixVersionTool(server);      // 11. Create project versions
  registerUpdateFixVersionTool(server);      // 12. Update version details
  
  // Helper Tools (2 tools)
  registerGetAssignableUsersTool(server);    // 13. Get users for assignment
  registerGetIssueTransitionsTool(server);   // 14. Get available transitions
}