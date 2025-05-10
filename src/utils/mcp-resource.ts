import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig } from './atlassian-api-base.js';
import { Logger } from './logger.js';
import { StandardMetadata, createStandardMetadata } from '../schemas/common.js';

const logger = Logger.getLogger('MCPResource');

/**
 * Create a resource response with JSON content
 * @param uri Resource URI
 * @param data JSON data to return
 * @returns Standard MCP resource response object
 */
export function createJsonResource(uri: string, data: any) {
  return {
    contents: [
      {
        uri: uri,
        mimeType: "application/json",
        text: JSON.stringify(data)
      }
    ]
  };
}

/**
 * Create a resource response with JSON content and schema
 * @param uri Resource URI
 * @param data JSON data to return
 * @param schema JSON Schema for the resource
 * @returns Standard MCP resource response object with schema
 */
export function createJsonResourceWithSchema(uri: string, data: any, schema: any) {
  return {
    contents: [
      {
        uri: uri,
        mimeType: "application/json",
        text: JSON.stringify(data),
        schema: schema
      }
    ]
  };
}

/**
 * Create a standardized resource response with metadata and schema
 * 
 * @param uri Resource URI
 * @param data The data object/array to return
 * @param dataKey The key name for the data in the response (e.g., "issues", "projects", "spaces")
 * @param schema The JSON Schema for the resource
 * @param totalCount Total number of records
 * @param limit Maximum number of records returned
 * @param offset Starting position
 * @param uiUrl Optional URL to Atlassian UI for this resource
 * @returns Standardized MCP resource response with metadata and schema
 */
export function createStandardResource(
  uri: string,
  data: any[],
  dataKey: string,
  schema: any,
  totalCount: number,
  limit: number,
  offset: number,
  uiUrl?: string
) {
  // Create standard metadata
  const metadata = createStandardMetadata(totalCount, limit, offset, uri, uiUrl);
  
  // Create response data object
  const responseData: Record<string, any> = {
    metadata: metadata
  };
  
  // Add the data with the specified key
  responseData[dataKey] = data;
  
  // Return formatted resource with schema
  return createJsonResourceWithSchema(uri, responseData, schema);
}

/**
 * Extract paging parameters from resource URI or request
 * 
 * @param params Parameters from URI or request
 * @param defaultLimit Default limit if not specified
 * @param defaultOffset Default offset if not specified
 * @returns Object with limit and offset
 */
export function extractPagingParams(
  params: any,
  defaultLimit: number = 20,
  defaultOffset: number = 0
): { limit: number, offset: number } {
  let limit = defaultLimit;
  let offset = defaultOffset;
  
  if (params) {
    // Extract limit
    if (params.limit) {
      const limitParam = Array.isArray(params.limit) ? params.limit[0] : params.limit;
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }
    
    // Extract offset
    if (params.offset) {
      const offsetParam = Array.isArray(params.offset) ? params.offset[0] : params.offset;
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }
  }
  
  return { limit, offset };
}

// Type definition for resource handler function
export type ResourceHandlerFunction = (
  params: any,
  context: { config: AtlassianConfig, uri: string }
) => Promise<any>;

// Type definition for MCP resource callback parameters
interface ResourceExtra {
  context?: {
    atlassianConfig?: AtlassianConfig;
    [key: string]: any;
  };
  [key: string]: any;
}

// Atlassian config from environment variables
const getAtlassianConfigFromEnv = (): AtlassianConfig => {
  const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
  const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
  const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';

  if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
    logger.error('Missing Atlassian credentials in environment variables');
    throw new Error('Missing Atlassian credentials in environment variables');
  }

  return {
    baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
      ? `https://${ATLASSIAN_SITE_NAME}` 
      : ATLASSIAN_SITE_NAME,
    email: ATLASSIAN_USER_EMAIL,
    apiToken: ATLASSIAN_API_TOKEN
  };
};

/**
 * Register a resource with MCP Server
 * @param server MCP Server instance
 * @param resourceName Resource name
 * @param resourceUri Resource URI pattern
 * @param description Resource description
 * @param handler Request handler function for the resource
 */
export function registerResource(
  server: McpServer, 
  resourceName: string,
  resourceUri: string | any, // accept ResourceTemplate
  description: string, 
  handler: ResourceHandlerFunction
) {
  logger.info(`Registering resource: ${resourceName} (${resourceUri instanceof Object && 'pattern' in resourceUri ? resourceUri.pattern : resourceUri})`);
  
  // Register resource with MCP Server according to API definition
  server.resource(resourceName, resourceUri, 
    // Callback function for ReadResourceCallback
    async (uri: string | URL, params: Record<string, any>, extra: ResourceExtra) => {
      try {
        // Get config from context or env
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && extra.context.atlassianConfig) {
          config = extra.context.atlassianConfig;
        } else {
          // fallback to env
          const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
          const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
          const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';
          config = {
            baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') ? `https://${ATLASSIAN_SITE_NAME}` : ATLASSIAN_SITE_NAME,
            email: ATLASSIAN_USER_EMAIL,
            apiToken: ATLASSIAN_API_TOKEN
          };
        }
        
        // Call handler with params, config and uri
        return await handler(params, { config, uri: typeof uri === 'string' ? uri : uri.href });
      } catch (error) {
        logger.error(`Error handling resource request for ${resourceName}:`, error);
        throw error;
      }
    }
  );
}
