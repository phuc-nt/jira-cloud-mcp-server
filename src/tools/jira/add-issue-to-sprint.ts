import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addIssueToSprint } from '../../utils/jira-tool-api-agile.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:addIssueToSprint');

export const addIssueToSprintSchema = z.object({
  sprintId: z.string().describe('Target sprint ID (must be future or active)'),
  issueKeys: z.array(z.string()).min(1).max(50).describe('List of issue keys to move to the sprint (max 50)')
});

type AddIssueToSprintParams = z.infer<typeof addIssueToSprintSchema>;

async function addIssueToSprintToolImpl(params: AddIssueToSprintParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  const { sprintId, issueKeys } = params;
  const result = await addIssueToSprint(config, sprintId, issueKeys);
  return {
    success: true,
    sprintId,
    issueKeys,
    result
  };
}

export const registerAddIssueToSprintTool = (server: McpServer) => {
  server.tool(
    'addIssueToSprint',
    `Add Issues to Active Sprint - Sprint Status Validation

AI CLIENT USAGE PATTERNS:

1. CHECK SPRINT STATUS FIRST (RECOMMENDED):
   listSprints({ boardId: 34 })
   → Find sprints with state: "active" or "future"
   → Avoid sprints with state: "closed"

2. ADD ISSUES TO ACTIVE SPRINT:
   addIssueToSprint({ sprintId: 123, issueKeys: ["PROJ-456", "PROJ-789"] })
   ✅ WORKS: When sprint is "active" or "future"

3. SPRINT STATE CONSTRAINTS:
   ✅ ACTIVE SPRINT: Can add issues freely
   ✅ FUTURE SPRINT: Can add issues for planning
   ❌ CLOSED SPRINT: Cannot add issues ("sprint has been completed")

4. COMMON WORKFLOW:
   Step 1: listSprints({ boardId: 34, state: "active" })  // Find active sprints
   Step 2: addIssueToSprint({ sprintId: activeSprintId, issueKeys: ["ISSUE-1"] })

ERROR PREVENTION:
- "Sprint has been completed": Sprint is closed, find an active sprint
- "Sprint not found": Check sprintId exists using listSprints
- "Permission denied": User may lack sprint management permissions
- "Issues not found": Verify issue keys exist and are accessible

SPRINT LIFECYCLE:
- FUTURE: Sprint created but not started (can add issues)
- ACTIVE: Sprint in progress (can add issues)  
- CLOSED: Sprint completed (CANNOT add issues)`,
    addIssueToSprintSchema.shape,
    async (params: AddIssueToSprintParams, context: Record<string, any>) => {
      try {
        const result = await addIssueToSprintToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in addIssueToSprint:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                success: false, 
                error: errorMessage,
                sprintId: params.sprintId,
                suggestion: errorMessage.includes('completed') || errorMessage.includes('closed')
                  ? "Sprint is closed. Use listSprints to find an active or future sprint."
                  : "Check sprint permissions and issue accessibility"
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};; 