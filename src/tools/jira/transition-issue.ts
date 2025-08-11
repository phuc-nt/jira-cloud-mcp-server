import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { transitionIssue } from '../../utils/jira-tool-api-v3.js';
import { ApiError } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:transitionIssue');

// Input parameter schema
export const transitionIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID or key of the issue (e.g., PROJ-123)'),
  transitionId: z.string().describe('ID of the transition to apply'),
  comment: z.string().optional().describe('Comment when performing the transition')
});

type TransitionIssueParams = z.infer<typeof transitionIssueSchema>;

async function transitionIssueToolImpl(params: TransitionIssueParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Transitioning issue ${params.issueIdOrKey} with transition ${params.transitionId}`);
  const result = await transitionIssue(
    config,
    params.issueIdOrKey,
    params.transitionId,
    params.comment
  );
  return {
    issueIdOrKey: params.issueIdOrKey,
    success: result.success,
    transitionId: params.transitionId,
    message: result.message
  };
}

// Register the tool with MCP Server
export const registerTransitionIssueTool = (server: McpServer) => {
  server.tool(
    'transitionIssue',
    `Transition Jira Issue Status - Smart Status Change

AI CLIENT USAGE PATTERNS:

1. RECOMMENDED WORKFLOW (use getIssueTransitions first):
   getIssueTransitions({ issueIdOrKey: "PROJ-123" })  // Get available transitions
   → Returns: [{ id: "11", name: "To Do" }, { id: "21", name: "In Progress" }, { id: "31", name: "Done" }]
   
   transitionIssue({ issueIdOrKey: "PROJ-123", transitionId: "21", comment: "Starting work" })
   → Safely transitions using correct ID

2. COMMON TRANSITION PATTERNS:
   - Start work: Usually ID "21" or "11" (varies by workflow)
   - Complete work: Usually ID "31", "41", or "51" (varies by workflow)
   - Reopen: Usually ID "71" or "81" (varies by workflow)

3. ERROR PREVENTION TIPS:
   ⚠️  NEVER guess transition IDs - workflows vary between projects
   ✅  ALWAYS call getIssueTransitions first to get valid IDs
   ⚠️  Cannot transition directly to "Done" if current status requires intermediate steps
   ✅  Follow the workflow sequence (e.g., To Do → In Progress → Done)

WORKFLOW CONSTRAINTS:
- Some transitions require specific permissions
- Certain status changes may be blocked by workflow rules
- Required fields may need to be filled before transition
- Some transitions are only available to specific user roles

ERROR HANDLING:
- "Invalid transition ID": Use getIssueTransitions to get correct IDs
- "Not applicable": Current status doesn't allow this transition
- "Permission denied": User lacks permission for this transition`,
    transitionIssueSchema.shape,
    async (params: TransitionIssueParams, context: Record<string, any>) => {
      try {
        const result = await transitionIssueToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                success: false, 
                error: errorMessage,
                issueKey: params.issueIdOrKey,
                suggestion: errorMessage.includes('Invalid transition') 
                  ? "Use getIssueTransitions first to get valid transition IDs for this issue"
                  : "Check issue permissions and workflow constraints"
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};; 