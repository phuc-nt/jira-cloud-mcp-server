import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { gadgetListSchema } from '../../schemas/jira.js';
import { getJiraAvailableGadgets } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';
import { Config, Resources } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:getGadgets');

export const registerGetJiraGadgetsResource = (server: McpServer) => {
  server.resource(
    'jira-gadgets-list',
    new ResourceTemplate('jira://gadgets', {
      list: async (_extra: any) => ({
        resources: [
          {
            uri: 'jira://gadgets',
            name: 'Jira Gadgets',
            description: 'List all available Jira gadgets for dashboard.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri: string | URL, params: Record<string, any>, extra: any) => {
      try {
        // Get config from context or environment
        const config = Config.getConfigFromContextOrEnv(extra?.context);
        const uriStr = typeof uri === 'string' ? uri : uri.href;
        const gadgets = await getJiraAvailableGadgets(config);
        return Resources.createStandardResource(
          uriStr,
          gadgets,
          'gadgets',
          gadgetListSchema,
          gadgets.length,
          gadgets.length,
          0,
          `${config.baseUrl}/jira/dashboards`
        );
      } catch (error) {
        logger.error('Error in getJiraAvailableGadgets:', error);
        throw error;
      }
    }
  );
};