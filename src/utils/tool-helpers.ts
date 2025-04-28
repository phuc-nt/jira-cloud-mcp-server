import { Logger } from './logger.js';

const logger = Logger.getLogger('MCPTool');

export function createToolResponse(text: string) {
  return {
    content: [{ type: 'text', text }]
  };
}

export function createErrorResponse(error: Error | string) {
  const message = error instanceof Error ? error.message : error;
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true
  };
}

export function registerTool(
  server: any,
  name: string,
  schema: any,
  handler: (params: any, context: any) => Promise<any>
) {
  logger.info(`Registering tool: ${name}`);
  server.tool(name, schema, async (params: any, context: any) => {
    try {
      logger.debug(`Executing tool ${name} with params:`, params);
      const result = await handler(params, context);
      logger.debug(`Tool ${name} executed successfully`);
      return result;
    } catch (error: any) {
      logger.error(`Error in tool ${name}:`, error);
      return createErrorResponse(error as Error | string);
    }
  });
}
