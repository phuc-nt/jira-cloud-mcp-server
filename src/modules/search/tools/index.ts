/**
 * Search Module Tool Registration
 * 17 Advanced Search & Discovery Tools - SPRINT 6.4.1 EPIC AGILE API ENHANCEMENT
 * Based on proven patterns from Sprint 6.1-6.3 with tool consolidation + Epic search via Agile API
 */

// Issue Search & Discovery (4 tools)
import { registerSearchIssuesTool } from '../../../tools/jira/search-issues.js';
import { registerEnhancedSearchIssuesTool } from '../../../tools/jira/enhanced-search-issues.js';
import { registerListBacklogIssuesTool } from '../../../tools/jira/list-backlog-issues.js';
import { registerEpicSearchAgileTool } from '../../../tools/jira/epic-search-agile.js';

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
  // Issue Search & Discovery (4 tools)
  registerSearchIssuesTool(server);               // 1. JQL-based issue search
  registerEnhancedSearchIssuesTool(server);       // 2. Smart filtering with auto-detection  
  registerListBacklogIssuesTool(server);          // 3. Backlog issue discovery
  registerEpicSearchAgileTool(server);            // 4. Epic search via Agile API (new approach)
  
  // Issue Read Operations (3 tools)
  registerGetIssueTool(server);                   // 5. Get detailed issue information
  registerGetIssueTransitionsTool(server);        // 6. Get available workflow transitions
  registerGetIssueCommentsTool(server);           // 7. Get all comments for specific issue
  
  // User Search & Discovery (2 tools)
  registerUniversalSearchUsersTool(server);       // 8. Universal user search (consolidated)
  registerListUsersTool(server);                  // 9. User listing with filters
  
  // User Read Operations (1 tool)
  registerGetUserTool(server);                    // 10. Get user profile and permissions
  
  // Project & Resource Discovery (5 tools)
  registerListProjectsTool(server);               // 11. Project discovery
  registerListProjectVersionsTool(server);        // 12. Version discovery
  registerListFiltersTool(server);                // 13. Filter discovery
  registerListBoardsTool(server);                 // 14. Board discovery
  registerListSprintsTool(server);                // 15. Sprint discovery
  
  // Project & Filter Read Operations (2 tools)
  registerGetProjectTool(server);                 // 16. Get detailed project information
  registerGetFilterTool(server);                  // 17. Get filter details with JQL
}