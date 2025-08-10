/**
 * Search Module Server - Advanced Search Operations
 * Specialized entry point for search and discovery tools
 * Based on proven BaseModuleServer pattern from Sprint 6.1-6.2
 */

import { BaseModuleServer } from '../../core/server-base.js';
import { registerSearchModuleTools } from './tools/index.js';

/**
 * Search Module Server extending BaseModuleServer
 * Handles advanced search, discovery, and query operations
 */
class SearchModuleServer extends BaseModuleServer {
  constructor() {
    super({
      name: 'mcp-jira-search',
      version: '4.0.0',
      moduleName: 'Search',
      toolCount: 18
    });
  }

  protected registerModuleTools(): void {
    registerSearchModuleTools(this.serverWithContext);
  }
}

// Create and start the Search module server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SearchModuleServer();
  server.startServer().catch(console.error);
}