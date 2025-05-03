import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig } from './atlassian-api.js';
import { Logger } from './logger.js';

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
 * Create a resource response with text content
 * @param uri Resource URI
 * @param data Text data to return
 * @returns Standard MCP resource response object
 */
export function createTextResource(uri: string, data: string) {
  return {
    contents: [
      {
        uri: uri,
        mimeType: "text/plain",
        text: data
      }
    ]
  };
}

/**
 * Define type for resource handler function
 */
export type ResourceHandlerFunction = (
  params: any, 
  context: { config: AtlassianConfig; uri: string }
) => Promise<any>;

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
    async (uri, extra) => {
      try {
        logger.info(`Handling resource request for: ${uri.href}`);
        
        // Get Atlassian config from extra.context if available, otherwise from environment variables
        let config: AtlassianConfig;
        try {
          // Safe access to context
          if (extra && typeof extra === 'object' && 'context' in extra && extra.context) {
            config = (extra.context as any).atlassianConfig as AtlassianConfig;
            
            // If atlassianConfig not found in context, create from env vars
            if (!config) {
              logger.warn(`atlassianConfig not found in context for resource: ${uri.href}, using env vars instead`);
              config = getAtlassianConfigFromEnv();
            }
          } else {
            // If no context, create from env vars
            logger.warn(`context not found in extra for resource: ${uri.href}, using env vars instead`);
            config = getAtlassianConfigFromEnv();
          }
        } catch (err) {
          // Fallback: create from env vars
          logger.warn(`Error accessing context for resource: ${uri.href}, using env vars instead`);
          config = getAtlassianConfigFromEnv();
        }
        
        // Call handler function with params and context
        const result = await handler({}, { config, uri: uri.href });
        logger.debug(`Resource result for ${uri.href}:`, result);
        
        return result;
      } catch (error) {
        logger.error(`Error in resource handler for ${uri.href}:`, error);
        throw error;
      }
    }
  );
}
