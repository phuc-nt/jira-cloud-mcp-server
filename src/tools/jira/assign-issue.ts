import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { assignIssue } from '../../utils/jira-tool-api-v3.js';
import { ApiError } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:assignIssue');

// Input parameter schema
export const assignIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID or key of the issue (e.g., PROJ-123)'),
  accountId: z.string().optional().describe('Account ID of the assignee (leave blank to unassign)')
});

type AssignIssueParams = z.infer<typeof assignIssueSchema>;

async function assignIssueToolImpl(params: AssignIssueParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Assigning issue ${params.issueIdOrKey} to ${params.accountId || 'no one'}`);
  const result = await assignIssue(
    config,
    params.issueIdOrKey,
    params.accountId || null
  );
  return {
    issueIdOrKey: params.issueIdOrKey,
    success: result.success,
    assignee: params.accountId || null,
    message: params.accountId
      ? `Issue ${params.issueIdOrKey} assigned to user with account ID: ${params.accountId}`
      : `Issue ${params.issueIdOrKey} unassigned`
  };
}

export const registerAssignIssueTool = (server: McpServer) => {
  server.tool(
    'assignIssue',
    `Assign Jira Issue to User - AccountId Required

AI CLIENT USAGE PATTERNS:

1. FIND USER FIRST (REQUIRED STEP):
   universalSearchUsers({ query: "john" })
   → Returns: [{ accountId: "5b10ac8d82e05b22cc7d4ef5", displayName: "John Smith", emailAddress: "john@company.com" }]

2. ASSIGN ISSUE USING ACCOUNTID:
   assignIssue({ issueIdOrKey: "PROJ-123", accountId: "5b10ac8d82e05b22cc7d4ef5" })
   ✅ CORRECT: Uses accountId from user search result

3. COMMON MISTAKES TO AVOID:
   ❌ WRONG: assignIssue({ issueIdOrKey: "PROJ-123", accountId: "john" })         // Username won't work
   ❌ WRONG: assignIssue({ issueIdOrKey: "PROJ-123", accountId: "john@company.com" }) // Email won't work
   ✅ RIGHT: assignIssue({ issueIdOrKey: "PROJ-123", accountId: "5b10ac8d82e05b22cc7d4ef5" }) // AccountId works

4. UNASSIGN ISSUE:
   assignIssue({ issueIdOrKey: "PROJ-123", accountId: "" })  // Empty string unassigns
   OR
   assignIssue({ issueIdOrKey: "PROJ-123" })  // Omit accountId to unassign

WORKFLOW RECOMMENDATIONS:
Step 1: Search for user: universalSearchUsers({ query: "user_name_or_email" })
Step 2: Extract accountId from search results
Step 3: Use accountId in assignIssue call

ERROR PREVENTION:
- "User does not exist": Use universalSearchUsers to find correct accountId
- "Permission denied": User may lack assign permissions for this project
- "Invalid accountId": Ensure you're using the full UUID accountId format`,
    assignIssueSchema.shape,
    async (params: AssignIssueParams, context: Record<string, any>) => {
      try {
        const result = await assignIssueToolImpl(params, context);
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
                suggestion: errorMessage.includes('does not exist') || errorMessage.includes('permission')
                  ? "Use universalSearchUsers first to find the correct accountId. Username or email won't work."
                  : "Check issue permissions and user access rights"
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};; 