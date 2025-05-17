/**
 * Create Filter Tool
 * 
 * This tool creates a new filter in Jira.
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createFilter } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:createFilter');

// Input parameter schema
export const createFilterSchema = z.object({
  name: z.string().describe('Filter name'),
  jql: z.string().describe('JQL query for the filter'),
  description: z.string().optional().describe('Filter description'),
  favourite: z.boolean().optional().describe('Mark as favourite')
});

type CreateFilterParams = z.infer<typeof createFilterSchema>;

async function createFilterToolImpl(params: CreateFilterParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  logger.info(`Creating filter: ${params.name}`);
  const response = await createFilter(config, params.name, params.jql, params.description, params.favourite);
  return {
    id: response.id,
    name: response.name,
    self: response.self,
    success: true
  };
}

// Register the tool with MCP Server
export const registerCreateFilterTool = (server: McpServer) => {
  server.tool(
    'createFilter',
    'Create a new filter in Jira',
    createFilterSchema.shape,
    async (params: CreateFilterParams, context: Record<string, any>) => {
      try {
        const result = await createFilterToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in createFilter:', error);
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