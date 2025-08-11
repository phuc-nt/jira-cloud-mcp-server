/**
 * Agile Module Tool Registration
 * 10 Sprint & Board Management Tools
 */

// Sprint Management tools
import { registerCreateSprintTool } from '../../../tools/jira/create-sprint.js';
import { registerStartSprintTool } from '../../../tools/jira/start-sprint.js';
import { registerCloseSprintTool } from '../../../tools/jira/close-sprint.js';
import { registerGetSprintTool } from '../../../tools/jira/get-sprint.js';
import { registerGetSprintIssuesTool } from '../../../tools/jira/get-sprint-issues.js';

// Board Management tools
import { registerGetBoardTool } from '../../../tools/jira/get-board.js';
import { registerGetBoardConfigurationTool } from '../../../tools/jira/get-board-configuration.js';
import { registerEnhancedGetBoardIssuesTool } from '../../../tools/jira/enhanced-get-board-issues.js';
import { registerListSprintsTool } from '../../../tools/jira/list-sprints.js';

// Backlog Management tools
import { registerAddIssueToSprintTool } from '../../../tools/jira/add-issue-to-sprint.js';

export function registerAgileModuleTools(server: any) {
  // Sprint Management (5 tools)
  registerCreateSprintTool(server);            // 1. Create new sprints
  registerStartSprintTool(server);             // 2. Start sprint execution
  registerCloseSprintTool(server);             // 3. Complete sprints
  registerGetSprintTool(server);               // 4. Get sprint details
  registerGetSprintIssuesTool(server);         // 5. Get issues in sprint
  
  // Board Management (4 tools)
  registerGetBoardTool(server);                // 6. Get board information
  registerGetBoardConfigurationTool(server);   // 7. Board configuration details
  registerEnhancedGetBoardIssuesTool(server);  // 8. Enhanced board issues
  registerListSprintsTool(server);             // 9. Enhanced sprint listing (replaces getBoardSprints)
  
  // Backlog Management (1 tool)
  registerAddIssueToSprintTool(server);        // 10. Add issues to sprint
}