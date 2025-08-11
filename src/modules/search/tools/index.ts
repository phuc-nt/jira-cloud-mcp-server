/**
 * Search Module Tool Registration
 * 14 Advanced Search & Discovery Tools - POST PHASE 7 OPTIMIZATION
 * Enhanced tools + Sprint listing moved to Agile module for better organization
 */

// Issue Search & Discovery (4 tools)
import { registerEnhancedSearchIssuesTool } from '../../../tools/jira/enhanced-search-issues.js';
import { registerEnhancedGetIssueTool } from '../../../tools/jira/enhanced-get-issue.js';
import { registerListBacklogIssuesTool } from '../../../tools/jira/list-backlog-issues.js';
import { registerEpicSearchAgileTool } from '../../../tools/jira/epic-search-agile.js';

// Issue Read Operations (2 tools) 
import { registerGetIssueTransitionsTool } from '../../../tools/jira/get-issue-transitions.js';
import { registerGetIssueCommentsTool } from '../../../tools/jira/get-issue-comments.js';

// User Search & Discovery (1 tool)
import { registerUniversalSearchUsersTool } from '../../../tools/jira/universal-search-users.js';

// User Read Operations (1 NEW tool)
import { registerGetUserTool } from '../../../tools/jira/get-user.js';

// Project & Resource Discovery (5 tools)
import { registerListProjectsTool } from '../../../tools/jira/list-projects.js';
import { registerListProjectVersionsTool } from '../../../tools/jira/list-project-versions.js';
import { registerListFiltersTool } from '../../../tools/jira/list-filters.js';
import { registerListBoardsTool } from '../../../tools/jira/list-boards.js';
// Removed: registerListSprintsTool (moved to Agile module for better organization)

// Project & Filter Read Operations (2 NEW tools)
import { registerGetProjectTool } from '../../../tools/jira/get-project.js';
import { registerGetFilterTool } from '../../../tools/jira/get-filter.js';

export function registerSearchModuleTools(server: any) {
  // Issue Search & Discovery (4 tools)
  registerEnhancedSearchIssuesTool(server);       // 1. Smart filtering with auto-detection (replaces searchIssues)
  registerEnhancedGetIssueTool(server);           // 2. Context-aware issue retrieval (replaces getIssue)
  registerListBacklogIssuesTool(server);          // 3. Backlog issue discovery
  registerEpicSearchAgileTool(server);            // 4. Epic search via Agile API (new approach)
  
  // Issue Read Operations (2 tools)
  registerGetIssueTransitionsTool(server);        // 5. Get available workflow transitions
  registerGetIssueCommentsTool(server);           // 6. Get all comments for specific issue
  
  // User Search & Discovery (1 tool)
  registerUniversalSearchUsersTool(server);       // 7. Universal user search (replaces listUsers + searchUsers)
  
  // User Read Operations (1 tool)
  registerGetUserTool(server);                    // 8. Get user profile and permissions
  
  // Project & Resource Discovery (5 tools)
  registerListProjectsTool(server);               // 9. Project discovery
  registerListProjectVersionsTool(server);        // 10. Version discovery
  registerListFiltersTool(server);                // 11. Filter discovery
  registerListBoardsTool(server);                 // 12. Board discovery
  // Removed: registerListSprintsTool (moved to Agile module as enhanced sprint listing)
  
  // Project & Filter Read Operations (2 tools)
  registerGetProjectTool(server);                 // 13. Get detailed project information
  registerGetFilterTool(server);                  // 14. Get filter details with JQL
  
  // Note: Removed tools replaced by enhanced versions:
  // - searchIssues → enhancedSearchIssues (smart JQL building)
  // - getIssue → enhancedGetIssue (context-aware expansion) 
  // - listUsers → universalSearchUsers (intelligent routing)
}