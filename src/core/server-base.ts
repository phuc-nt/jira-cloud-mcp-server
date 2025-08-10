import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Logger } from '../utils/logger.js';
import { AtlassianConfig } from '../utils/atlassian-api-base.js';

// Load environment variables
dotenv.config();

export interface ModuleServerConfig {
  name: string;
  version: string;
  moduleName: string;
  toolCount: number;
}

export interface ServerWithContext {
  tool: (name: string, description: string, schema: any, handler: any) => void;
}

export abstract class BaseModuleServer {
  protected server!: McpServer;
  protected logger: Logger;
  protected atlassianConfig!: AtlassianConfig;
  protected serverWithContext!: ServerWithContext;

  constructor(protected config: ModuleServerConfig) {
    this.logger = Logger.getLogger(`MCP:${config.moduleName}`);
    this.initializeAtlassianConfig();
    this.initializeMcpServer();
    this.createServerWithContext();
  }

  private initializeAtlassianConfig(): void {
    const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME;
    const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL;
    const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN;

    if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
      this.logger.error('Missing Atlassian credentials in environment variables');
      process.exit(1);
    }

    this.atlassianConfig = {
      baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
        ? `https://${ATLASSIAN_SITE_NAME}` 
        : ATLASSIAN_SITE_NAME,
      email: ATLASSIAN_USER_EMAIL,
      apiToken: ATLASSIAN_API_TOKEN
    };
  }

  private initializeMcpServer(): void {
    this.server = new McpServer({
      name: process.env.MCP_SERVER_NAME || this.config.name,
      version: process.env.MCP_SERVER_VERSION || this.config.version,
      capabilities: {
        tools: {}  // Only tools capability - no resources
      }
    });
  }

  private createServerWithContext(): void {
    this.serverWithContext = {
      tool: (name: string, description: string, schema: any, handler: any) => {
        this.server.tool(name, description, schema, async (params: any, context: any) => {
          // Ensure context object exists before setting properties
          if (!context) {
            context = {};
          }
          context.atlassianConfig = this.atlassianConfig;
          return await handler(params, context);
        });
      }
    };
  }

  protected abstract registerModuleTools(): void;

  async startServer(): Promise<void> {
    try {
      this.logger.info(`Initializing MCP ${this.config.moduleName} Module...`);
      
      // Register module-specific tools
      this.registerModuleTools();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logger.info(`MCP ${this.config.moduleName} Module v${this.config.version} started successfully`);
      this.logger.info(`Connected to: ${process.env.ATLASSIAN_SITE_NAME}`);
      this.logger.info(`Architecture: ${this.config.moduleName} Module (${this.config.toolCount} tools registered)`);
    } catch (error) {
      this.logger.error(`${this.config.moduleName} module startup failed:`, error);
      process.exit(1);
    }
  }
}

export function createModuleServer(
  config: ModuleServerConfig,
  registerTools: (server: ServerWithContext) => void
): BaseModuleServer {
  return new class extends BaseModuleServer {
    protected registerModuleTools(): void {
      this.logger.info(`Registering ${this.config.moduleName} Module Tools...`);
      registerTools(this.serverWithContext);
    }
  }(config);
}