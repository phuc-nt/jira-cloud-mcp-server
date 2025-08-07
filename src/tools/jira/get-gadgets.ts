import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getJiraAvailableGadgets } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:getGadgets');

export const registerGetJiraGadgetsTool = (server: any) => {
  server.tool(
    'getJiraGadgets',
    'Get list of all available Jira gadgets for dashboard',
    {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    async (params: any, context: any) => {
      try {
        // Get config from context
        const config = Config.getConfigFromContextOrEnv(context);
        const gadgets = await getJiraAvailableGadgets(config);
        
        return {
          content: [
            { type: 'text', text: `Found ${gadgets.length} available Jira gadgets` },
            { type: 'json', data: { gadgets, total: gadgets.length } }
          ]
        };
      } catch (error) {
        logger.error('Error in getJiraGadgets tool:', error);
        return {
          content: [{ type: 'text', text: `Error getting Jira gadgets: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  );
};