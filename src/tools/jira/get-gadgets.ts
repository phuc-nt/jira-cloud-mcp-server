import { registerResource, createStandardResource } from '../../utils/mcp-resource.js';
import { ResourceTemplate, McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { gadgetListSchema } from '../../schemas/jira.js';
import { getJiraAvailableGadgets } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';

const logger = Logger.getLogger('JiraTools:getGadgets');

export const registerGetJiraGadgetsResource = (server: McpServer) => {
  registerResource(
    server,
    'jira-gadgets-list',
    new ResourceTemplate('jira://gadgets', { list: undefined }),
    'Lấy danh sách tất cả gadget có sẵn để thêm vào dashboard',
    async (_params, { config, uri }) => {
      try {
        const gadgets = await getJiraAvailableGadgets(config);
        return createStandardResource(
          uri,
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