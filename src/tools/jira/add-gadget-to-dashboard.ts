import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addGadgetToDashboard } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:addGadgetToDashboard');

const colorEnum = z.enum(['blue', 'red', 'yellow', 'green', 'cyan', 'purple', 'gray', 'white']);

const addGadgetToDashboardBaseSchema = z.object({
  dashboardId: z.string().describe('Dashboard ID'),
  moduleKey: z.string().optional().describe('Gadget moduleKey (recommended, e.g. "com.atlassian.plugins.atlassian-connect-plugin:sample-dashboard-item"). Only one of moduleKey or uri should be provided.'),
  uri: z.string().optional().describe('Gadget URI (legacy, e.g. "/rest/gadgets/1.0/g/com.atlassian.jira.gadgets:filter-results-gadget/gadgets/filter-results-gadget.xml"). Only one of moduleKey or uri should be provided.'),
  title: z.string().optional().describe('Gadget title (optional)'),
  color: colorEnum.describe('Gadget color. Must be one of: blue, red, yellow, green, cyan, purple, gray, white.'),
  position: z.object({
    column: z.number().describe('Column index (0-based)'),
    row: z.number().describe('Row index (0-based)')
  }).optional().describe('Position of the gadget on the dashboard (optional)')
});

export const addGadgetToDashboardSchema = addGadgetToDashboardBaseSchema.refine(
  (data) => !!data.moduleKey !== !!data.uri,
  { message: 'You must provide either moduleKey or uri, but not both.' }
);

type AddGadgetToDashboardParams = z.infer<typeof addGadgetToDashboardBaseSchema>;

async function addGadgetToDashboardToolImpl(params: AddGadgetToDashboardParams, context: any) {
  if (!!params.moduleKey === !!params.uri) {
    return {
      success: false,
      error: 'You must provide either moduleKey or uri, but not both.'
    };
  }
  const config = Config.getConfigFromContextOrEnv(context);
  const { dashboardId, moduleKey, uri, ...rest } = params;
  let gadgetUri = uri;
  if (!gadgetUri && moduleKey) {
    return {
      success: false,
      error: 'Jira Cloud API chỉ hỗ trợ thêm gadget qua uri. Vui lòng cung cấp uri hợp lệ.'
    };
  }
  if (!gadgetUri) {
    return {
      success: false,
      error: 'Thiếu uri gadget.'
    };
  }
  const data = { uri: gadgetUri, ...rest };
  const result = await addGadgetToDashboard(config, dashboardId, data);
  return {
    success: true,
    dashboardId,
    uri: gadgetUri,
    ...rest,
    result
  };
}

export const registerAddGadgetToDashboardTool = (server: McpServer) => {
  server.tool(
    'addGadgetToDashboard',
    'Add gadget to Jira dashboard (POST /rest/api/3/dashboard/{dashboardId}/gadget)',
    addGadgetToDashboardBaseSchema.shape,
    async (params: AddGadgetToDashboardParams, context: Record<string, any>) => {
      try {
        const result = await addGadgetToDashboardToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in addGadgetToDashboard:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) })
            }
          ],
          isError: true
        };
      }
    }
  );
}; 