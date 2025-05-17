import { createStandardResource, getAtlassianConfigFromEnv } from '../../utils/mcp-resource.js';
import { ResourceTemplate, McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { gadgetListSchema } from '../../schemas/jira.js';
import { getJiraAvailableGadgets } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';

const logger = Logger.getLogger('JiraTools:getGadgets');

export const registerGetJiraGadgetsResource = (server: McpServer) => {
  server.resource(
    'jira-gadgets-list',
    new ResourceTemplate('jira://gadgets', {
      list: async (_extra) => ({
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
        const config: AtlassianConfig = extra?.context?.atlassianConfig || getAtlassianConfigFromEnv();
        const uriStr = typeof uri === 'string' ? uri : uri.href;
        
        const gadgets = await getJiraAvailableGadgets(config);
        return createStandardResource(
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