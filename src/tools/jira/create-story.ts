import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:createStory');

// Input schema for createStory tool
const CreateStoryInputSchema = z.object({
  projectKey: z.string().describe('Project key where the Story will be created'),
  summary: z.string().describe('Story summary'),
  description: z.string().optional().describe('Story description'),
  epicKey: z.string().optional().describe('Epic key to link this Story to'),
  storyPoints: z.number().optional().describe('Story points estimation'),
  priority: z.string().optional().describe('Priority name (e.g., "High", "Medium", "Low")'),
  assignee: z.string().optional().describe('Assignee account ID'),
  reporter: z.string().optional().describe('Reporter account ID'),
  labels: z.array(z.string()).optional().describe('Array of labels'),
  components: z.array(z.string()).optional().describe('Array of component names'),
  fixVersions: z.array(z.string()).optional().describe('Array of fix version names'),
  customFields: z.record(z.any()).optional().describe('Additional custom fields as key-value pairs')
});

type CreateStoryParams = z.infer<typeof CreateStoryInputSchema>;

async function createStoryImpl(params: CreateStoryParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Creating Story in project: ${params.projectKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    headers['Content-Type'] = 'application/json';
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    
    // Build the Story creation payload
    const storyData: any = {
      fields: {
        project: {
          key: params.projectKey
        },
        summary: params.summary,
        issuetype: {
          name: "Story"
        }
      }
    };

    // Add optional fields
    if (params.description) {
      storyData.fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: params.description
              }
            ]
          }
        ]
      };
    }

    if (params.priority) {
      storyData.fields.priority = { name: params.priority };
    }

    if (params.assignee) {
      storyData.fields.assignee = { accountId: params.assignee };
    }

    if (params.reporter) {
      storyData.fields.reporter = { accountId: params.reporter };
    }

    if (params.labels && params.labels.length > 0) {
      storyData.fields.labels = params.labels;
    }

    if (params.components && params.components.length > 0) {
      storyData.fields.components = params.components.map(name => ({ name }));
    }

    if (params.fixVersions && params.fixVersions.length > 0) {
      storyData.fields.fixVersions = params.fixVersions.map(name => ({ name }));
    }

    // Add Story points (common custom field IDs)
    if (params.storyPoints !== undefined) {
      // Try common Story Points custom field IDs
      storyData.fields.customfield_10016 = params.storyPoints; // Most common
      storyData.fields.customfield_10004 = params.storyPoints; // Alternative
      storyData.fields.storyPoints = params.storyPoints; // Some instances
    }

    // Add Epic Link (common custom field IDs)
    if (params.epicKey) {
      // Try common Epic Link custom field IDs
      storyData.fields.customfield_10014 = params.epicKey; // Most common
      storyData.fields.customfield_10008 = params.epicKey; // Alternative
      storyData.fields.epicLink = params.epicKey; // Some instances
    }

    // Add any additional custom fields
    if (params.customFields) {
      Object.assign(storyData.fields, params.customFields);
    }
    
    // Call Jira API to create the Story
    const url = `${baseUrl}/rest/api/3/issue`;
    
    const response = await fetch(url, { 
      method: 'POST',
      headers, 
      body: JSON.stringify(storyData),
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (create story, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const createdStory = await response.json();
    
    logger.info(`Successfully created Story: ${createdStory.key}`);
    
    return {
      success: true,
      story: {
        key: createdStory.key,
        id: createdStory.id,
        self: createdStory.self
      },
      data: createdStory,
      message: `Story ${createdStory.key} created successfully in project ${params.projectKey}`
    };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error creating Story in project ${params.projectKey}:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to create Story: ${error.message}`, 500);
  }
}

/**
 * Create a new Story with Story-specific fields like Epic link and Story points
 */
export const registerCreateStoryTool = (server: any) => {
  server.tool(
    'createStory',
    'Create a new Story with Story-specific fields like Epic link and Story points',
    CreateStoryInputSchema.shape,
    async (params: CreateStoryParams, context: Record<string, any>) => {
      try {
        const result = await createStoryImpl(params, context);
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
                error: error instanceof Error ? error.message : String(error),
                projectKey: params.projectKey
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};
