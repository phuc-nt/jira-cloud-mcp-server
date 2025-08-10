/**
 * Search Module Tool Registration
 * 18 Advanced Search & Discovery Tools - SPRINT 6.3 EXPANDED
 * Based on proven patterns from Sprint 6.1-6.2
 */

// Issue Search & Discovery (4 tools)
import { registerSearchIssuesTool } from '../../../tools/jira/search-issues.js';
import { registerEnhancedSearchIssuesTool } from '../../../tools/jira/enhanced-search-issues.js';
import { registerListIssuesTool } from '../../../tools/jira/list-issues.js';
import { registerListBacklogIssuesTool } from '../../../tools/jira/list-backlog-issues.js';

// Issue Read Operations (3 NEW tools)
import { registerGetIssueTool } from '../../../tools/jira/get-issue.js';
import { registerGetIssueTransitionsTool } from '../../../tools/jira/get-issue-transitions.js';
import { registerGetIssueCommentsTool } from '../../../tools/jira/get-issue-comments.js';

// User Search & Discovery (3 tools)
import { registerSearchUsersTool } from '../../../tools/jira/search-users.js';
import { registerUniversalSearchUsersTool } from '../../../tools/jira/universal-search-users.js';
import { registerListUsersTool } from '../../../tools/jira/list-users.js';

// User Read Operations (1 NEW tool)
import { registerGetUserTool } from '../../../tools/jira/get-user.js';

// Project & Resource Discovery (5 tools)
import { registerListProjectsTool } from '../../../tools/jira/list-projects.js';
import { registerListProjectVersionsTool } from '../../../tools/jira/list-project-versions.js';
import { registerListFiltersTool } from '../../../tools/jira/list-filters.js';
import { registerListBoardsTool } from '../../../tools/jira/list-boards.js';
import { registerListSprintsTool } from '../../../tools/jira/list-sprints.js';

// Project & Filter Read Operations (2 NEW tools)
import { registerGetProjectTool } from '../../../tools/jira/get-project.js';
import { registerGetFilterTool } from '../../../tools/jira/get-filter.js';

export function registerSearchModuleTools(server: any) {
  // Issue Search & Discovery (4 tools)
  registerSearchIssuesTool(server);               // 1. JQL-based issue search
  registerEnhancedSearchIssuesTool(server);       // 2. Smart filtering with auto-detection
  registerListIssuesTool(server);                 // 3. Simple issue listing
  registerListBacklogIssuesTool(server);          // 4. Backlog issue discovery
  
  // Issue Read Operations (3 NEW tools)
  registerGetIssueTool(server);                   // 5. Get detailed issue information
  registerGetIssueTransitionsTool(server);        // 6. Get available workflow transitions
  registerGetIssueCommentsTool(server);           // 7. Get all comments for specific issue
  
  // User Search & Discovery (3 tools)
  registerSearchUsersTool(server);                // 8. Basic user search
  registerUniversalSearchUsersTool(server);       // 9. Universal user search (consolidated)
  registerListUsersTool(server);                  // 10. User listing with filters
  
  // User Read Operations (1 NEW tool)
  registerGetUserTool(server);                    // 11. Get user profile and permissions
  
  // Project & Resource Discovery (5 tools)
  registerListProjectsTool(server);               // 12. Project discovery
  registerListProjectVersionsTool(server);        // 13. Version discovery
  registerListFiltersTool(server);                // 14. Filter discovery
  registerListBoardsTool(server);                 // 15. Board discovery
  registerListSprintsTool(server);                // 16. Sprint discovery
  
  // Project & Filter Read Operations (2 NEW tools)
  registerGetProjectTool(server);                 // 17. Get detailed project information
  registerGetFilterTool(server);                  // 18. Get filter details with JQL
}