import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:updateFixVersion');

// Input parameter schema
export const updateFixVersionSchema = z.object({
  versionId: z.string().describe('Version ID to update (e.g., 10100)'),
  name: z.string().optional().describe('New version name'),
  description: z.string().optional().describe('New version description'),
  releaseDate: z.string().optional().describe('New release date in YYYY-MM-DD format'),
  startDate: z.string().optional().describe('New start date in YYYY-MM-DD format'),
  released: z.boolean().optional().describe('Mark version as released/unreleased'),
  archived: z.boolean().optional().describe('Archive/unarchive version')
});

type UpdateFixVersionParams = z.infer<typeof updateFixVersionSchema>;

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

async function updateFixVersionToolImpl(params: UpdateFixVersionParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Updating version ID: ${params.versionId}`);

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

    // Check if at least one field is provided to update
    const fieldsToUpdate = Object.keys(params).filter(key => 
      key !== 'versionId' && params[key as keyof UpdateFixVersionParams] !== undefined
    );

    if (fieldsToUpdate.length === 0) {
      return {
        success: false,
        error: 'No fields provided to update',
        code: 'NO_FIELDS_TO_UPDATE'
      };
    }

    // Prepare update data - only include fields that are specified
    const updateData: any = {};
    
    if (params.name !== undefined) {
      updateData.name = params.name;
    }
    
    if (params.description !== undefined) {
      updateData.description = params.description;
    }
    
    if (params.releaseDate !== undefined) {
      updateData.releaseDate = params.releaseDate;
    }
    
    if (params.startDate !== undefined) {
      updateData.startDate = params.startDate;
    }
    
    if (params.released !== undefined) {
      updateData.released = params.released;
    }
    
    if (params.archived !== undefined) {
      updateData.archived = params.archived;
    }

    // Update the version
    const url = `${baseUrl}/rest/api/3/version/${encodeURIComponent(params.versionId)}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData),
      credentials: 'omit'
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (update version, ${response.status}):`, responseText);
      
      const statusCode = response.status;
      if (statusCode === 400) {
        if (responseText.includes('already exists') || responseText.includes('duplicate')) {
          throw new ApiError(
            ApiErrorType.VALIDATION_ERROR,
            `Version name '${params.name}' already exists in the project`,
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
          `Insufficient permissions to update this version. Administer Projects permission required.`,
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Version ${params.versionId} not found`,
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
    
    logger.info(`Successfully updated version: ${result.name} (ID: ${result.id})`);
    
    // Create summary of what was updated
    const updatedFields = [];
    if (params.name !== undefined) updatedFields.push(`name: '${result.name}'`);
    if (params.description !== undefined) updatedFields.push(`description: '${result.description || 'cleared'}'`);
    if (params.releaseDate !== undefined) updatedFields.push(`releaseDate: '${result.releaseDate || 'cleared'}'`);
    if (params.startDate !== undefined) updatedFields.push(`startDate: '${result.startDate || 'cleared'}'`);
    if (params.released !== undefined) updatedFields.push(`released: ${result.released}`);
    if (params.archived !== undefined) updatedFields.push(`archived: ${result.archived}`);

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
      updatedFields: updatedFields,
      message: `Version '${result.name}' updated successfully. Updated fields: ${updatedFields.join(', ')}`
    };

  } catch (error) {
    logger.error('Error updating version:', error);
    
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
      code: 'UPDATE_VERSION_FAILED'
    };
  }
}

export const registerUpdateFixVersionTool = (server: McpServer) => {
  server.tool(
    'updateFixVersion',
    'Update a Fix Version including name, description, release date, and status',
    updateFixVersionSchema.shape,
    async (params: UpdateFixVersionParams, context: Record<string, any>) => {
      try {
        const result = await updateFixVersionToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in updateFixVersion tool:', error);
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
