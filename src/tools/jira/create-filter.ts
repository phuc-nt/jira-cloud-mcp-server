/**
 * Create Filter Tool
 * 
 * This tool creates a new filter in Jira.
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createFilter as createJiraFilter } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

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

interface CreateFilterResult {
  id: string;
  name: string;
  self: string;
  success: boolean;
}

// Main handler to create a new filter
export async function createFilterHandler(
  params: CreateFilterParams,
  config: any
): Promise<CreateFilterResult> {
  try {
    logger.info(`Creating filter: ${params.name}`);
    const response = await createJiraFilter(config, params.name, params.jql, params.description, params.favourite);
    return {
      id: response.id,
      name: response.name,
      self: response.self,
      success: true
    };
  } catch (error) {
    logger.error('Error creating filter:', error);
    throw error;
  }
}

// Register the tool with MCP Server
export const registerCreateFilterTool = (server: McpServer) => {
  server.tool(
    'createFilter',
    'Create a new filter in Jira',
    createFilterSchema.shape,
    async (params: CreateFilterParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Kiểm tra atlassianConfig và email, fallback sang biến môi trường nếu cần
        if (!context.atlassianConfig) {
          logger.error('[createFilter] Missing Atlassian config in context:', JSON.stringify(context));
          return createErrorResponse('Missing Atlassian config in context');
        }
        if (!context.atlassianConfig.email) {
          // Fallback: lấy từ biến môi trường
          logger.warn('[createFilter] context.atlassianConfig.email is missing. Trying to get from env...');
          const envEmail = process.env.JIRA_EMAIL || process.env.ATLASSIAN_EMAIL || process.env.ATLASSIAN_USER_EMAIL;
          logger.warn('[createFilter] Env JIRA_EMAIL:', process.env.JIRA_EMAIL);
          logger.warn('[createFilter] Env ATLASSIAN_EMAIL:', process.env.ATLASSIAN_EMAIL);
          logger.warn('[createFilter] Env ATLASSIAN_USER_EMAIL:', process.env.ATLASSIAN_USER_EMAIL);
          if (envEmail) {
            logger.info('[createFilter] Using email from env:', envEmail);
            context.atlassianConfig.email = envEmail;
          } else {
            logger.error('[createFilter] Missing Atlassian user email in context and environment. Context:', JSON.stringify(context));
            return createErrorResponse('Missing Atlassian user email in context and environment');
          }
        }
        // Create new filter
        const result = await createFilterHandler(params, context.atlassianConfig);
        // Return MCP-compliant response
        return createTextResponse(
          `Filter created successfully with ID: ${result.id}`,
          {
            id: result.id,
            name: result.name,
            self: result.self,
            success: result.success
          }
        );
      } catch (error) {
        return createErrorResponse(
          `Error while creating filter: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 