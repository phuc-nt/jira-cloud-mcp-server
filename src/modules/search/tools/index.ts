/**
 * Search Module Tool Registration
 * 16 Advanced Search & Discovery Tools - SPRINT 6.4 OPTIMIZED
 * Based on proven patterns from Sprint 6.1-6.3 with tool consolidation
 */

// Issue Search & Discovery (3 tools)
import { registerSearchIssuesTool } from '../../../tools/jira/search-issues.js';
import { registerEnhancedSearchIssuesTool } from '../../../tools/jira/enhanced-search-issues.js';
import { registerListBacklogIssuesTool } from '../../../tools/jira/list-backlog-issues.js';

// Issue Read Operations (3 NEW tools)
import { registerGetIssueTool } from '../../../tools/jira/get-issue.js';
import { registerGetIssueTransitionsTool } from '../../../tools/jira/get-issue-transitions.js';
import { registerGetIssueCommentsTool } from '../../../tools/jira/get-issue-comments.js';

// User Search & Discovery (2 tools)
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
  // Issue Search & Discovery (3 tools)
  registerSearchIssuesTool(server);               // 1. JQL-based issue search
  registerEnhancedSearchIssuesTool(server);       // 2. Smart filtering with auto-detection
  registerListBacklogIssuesTool(server);          // 3. Backlog issue discovery
  
  // Issue Read Operations (3 tools)
  registerGetIssueTool(server);                   // 4. Get detailed issue information
  registerGetIssueTransitionsTool(server);        // 5. Get available workflow transitions
  registerGetIssueCommentsTool(server);           // 6. Get all comments for specific issue
  
  // User Search & Discovery (2 tools)
  registerUniversalSearchUsersTool(server);       // 7. Universal user search (consolidated)
  registerListUsersTool(server);                  // 8. User listing with filters
  
  // User Read Operations (1 tool)
  registerGetUserTool(server);                    // 9. Get user profile and permissions
  
  // Project & Resource Discovery (5 tools)
  registerListProjectsTool(server);               // 10. Project discovery
  registerListProjectVersionsTool(server);        // 11. Version discovery
  registerListFiltersTool(server);                // 12. Filter discovery
  registerListBoardsTool(server);                 // 13. Board discovery
  registerListSprintsTool(server);                // 14. Sprint discovery
  
  // Project & Filter Read Operations (2 tools)
  registerGetProjectTool(server);                 // 15. Get detailed project information
  registerGetFilterTool(server);                  // 16. Get filter details with JQL
}