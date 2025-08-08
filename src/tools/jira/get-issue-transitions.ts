import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getIssueTransitions');

// Input parameter schema
export const getIssueTransitionsSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123)'),
  expand: z.string().optional().describe('Expand options for transitions (e.g., "transitions.fields")')
});

type GetIssueTransitionsParams = z.infer<typeof getIssueTransitionsSchema>;

async function getIssueTransitionsImpl(params: GetIssueTransitionsParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting transitions for issue: ${params.issueKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build URL with optional expand parameter
    let url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(params.issueKey)}/transitions`;
    if (params.expand) {
      url += `?expand=${encodeURIComponent(params.expand)}`;
    }

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (get issue transitions, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const data = await response.json();
    
    // Format transition information
    const transitions = data.transitions?.map((transition: any) => ({
      id: transition.id,
      name: transition.name,
      description: transition.description,
      to: {
        id: transition.to.id,
        name: transition.to.name,
        description: transition.to.description,
        category: transition.to.statusCategory?.name,
        colorName: transition.to.statusCategory?.colorName
      },
      hasScreen: transition.hasScreen,
      isGlobal: transition.isGlobal,
      isInitial: transition.isInitial,
      isAvailable: transition.isAvailable,
      isConditional: transition.isConditional,
      // Include fields if expanded
      fields: transition.fields ? Object.entries(transition.fields).map(([key, field]: [string, any]) => ({
        key,
        name: field.name,
        required: field.required,
        schema: field.schema,
        operations: field.operations,
        allowedValues: field.allowedValues
      })) : undefined
    })) || [];

    return {
      issueKey: params.issueKey,
      transitions,
      totalTransitions: transitions.length,
      success: true
    };

  } catch (error) {
    logger.error('Error getting issue transitions:', error);
    throw error;
  }
}

export const registerGetIssueTransitionsTool = (server: McpServer) => {
  server.tool(
    'getIssueTransitions',
    'Get available transitions for a specific Jira issue',
    getIssueTransitionsSchema.shape,
    async (params: GetIssueTransitionsParams, context: Record<string, any>) => {
      try {
        const result = await getIssueTransitionsImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                success: false, 
                error: error instanceof Error ? error.message : String(error) 
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};