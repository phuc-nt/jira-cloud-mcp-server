import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:createFixVersion');

// Input parameter schema
export const createFixVersionSchema = z.object({
  projectKey: z.string().describe('Project key to create version in (e.g., PROJ, DEMO)'),
  name: z.string().describe('Version name (e.g., v2.1.0, Sprint 15, Q3 2025)'),
  description: z.string().optional().describe('Version description'),
  releaseDate: z.string().optional().describe('Target release date in YYYY-MM-DD format'),
  startDate: z.string().optional().describe('Version start date in YYYY-MM-DD format'),
  released: z.boolean().optional().default(false).describe('Mark version as released (default: false)'),
  archived: z.boolean().optional().default(false).describe('Mark version as archived (default: false)')
});

type CreateFixVersionParams = z.infer<typeof createFixVersionSchema>;

async function createFixVersionToolImpl(params: CreateFixVersionParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Creating fix version: ${params.name} in project ${params.projectKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    
    // Validate date formats if provided
    if (params.releaseDate && !isValidDateFormat(params.releaseDate)) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Invalid release date format. Use YYYY-MM-DD format.',
        400
      );
    }
    
    if (params.startDate && !isValidDateFormat(params.startDate)) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Invalid start date format. Use YYYY-MM-DD format.',
        400
      );
    }

    // First check if project exists and user has permissions
    try {
      const projectUrl = `${baseUrl}/rest/api/3/project/${encodeURIComponent(params.projectKey)}`;
      const projectResponse = await fetch(projectUrl, { 
        method: 'GET',
        headers, 
        credentials: 'omit' 
      });
      
      if (!projectResponse.ok) {
        const responseText = await projectResponse.text();
        if (projectResponse.status === 404) {
          throw new ApiError(
            ApiErrorType.NOT_FOUND_ERROR,
            `Project '${params.projectKey}' not found or not accessible`,
            404,
            new Error(responseText)
          );
        }
        throw new Error(`Project check failed: ${responseText}`);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        ApiErrorType.UNKNOWN_ERROR,
        `Error checking project: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }

    // Prepare version data
    const versionData: any = {
      name: params.name,
      project: params.projectKey,
      archived: params.archived || false,
      released: params.released || false
    };

    if (params.description) {
      versionData.description = params.description;
    }

    if (params.releaseDate) {
      versionData.releaseDate = params.releaseDate;
    }

    if (params.startDate) {
      versionData.startDate = params.startDate;
    }

    // Create the version
    const url = `${baseUrl}/rest/api/3/version`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(versionData),
      credentials: 'omit'
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (create version, ${response.status}):`, responseText);
      
      const statusCode = response.status;
      if (statusCode === 400) {
        if (responseText.includes('already exists') || responseText.includes('duplicate')) {
          throw new ApiError(
            ApiErrorType.VALIDATION_ERROR,
            `Version name '${params.name}' already exists in project ${params.projectKey}`,
            statusCode,
            new Error(responseText)
          );
        }
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          `Bad request: ${responseText}`,
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 401) {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION_ERROR,
          "Unauthorized. Check your credentials.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 403) {
        throw new ApiError(
          ApiErrorType.AUTHORIZATION_ERROR,
          `Insufficient permissions to create versions in project ${params.projectKey}. Administer Projects permission required.`,
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Project ${params.projectKey} not found`,
          statusCode,
          new Error(responseText)
        );
      } else {
        throw new ApiError(
          ApiErrorType.SERVER_ERROR,
          `Jira API error: ${responseText}`,
          statusCode,
          new Error(responseText)
        );
      }
    }

    const result = await response.json();
    
    logger.info(`Successfully created fix version: ${result.name} (ID: ${result.id})`);
    
    return {
      success: true,
      data: {
        id: result.id,
        name: result.name,
        description: result.description,
        projectId: result.projectId,
        released: result.released,
        archived: result.archived,
        releaseDate: result.releaseDate,
        startDate: result.startDate,
        self: result.self
      },
      message: `Fix version '${result.name}' created successfully in project ${params.projectKey}`
    };

  } catch (error) {
    logger.error('Error creating fix version:', error);
    
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        code: error.type
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      code: 'CREATE_VERSION_FAILED'
    };
  }
}

// Helper function to validate date format
function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && 
         date.toISOString().substr(0, 10) === dateString;
}

export const registerCreateFixVersionTool = (server: McpServer) => {
  server.tool(
    'createFixVersion',
    'Create a new Fix Version (release version) in a Jira project for release planning and issue tracking',
    createFixVersionSchema.shape,
    async (params: CreateFixVersionParams, context: Record<string, any>) => {
      try {
        const result = await createFixVersionToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in createFixVersion tool:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                success: false, 
                error: error instanceof Error ? error.message : String(error),
                code: 'TOOL_EXECUTION_ERROR'
              }, null, 2)
            }
          ]
        };
      }
    }
  );
};
