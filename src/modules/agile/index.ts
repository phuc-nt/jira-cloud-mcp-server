#!/usr/bin/env node
/**
 * Agile Module Entry Point
 * 10 Sprint & Board Management Tools
 * Memory optimized for Agile workflows
 */

import { BaseModuleServer } from '../../core/server-base.js';
import { registerAgileModuleTools } from './tools/index.js';
import { MODULE_DEFINITIONS } from '../../core/utils/module-types.js';

class AgileModuleServer extends BaseModuleServer {
  constructor() {
    super({
      name: 'mcp-jira-agile',
      version: '4.0.0-alpha.1',
      moduleName: 'Agile',
      toolCount: 10
    });
  }

  protected registerModuleTools(): void {
    registerAgileModuleTools(this.server);
  }
}

// Create and start the Agile module server
export function createAgileModuleServer() {
  return new AgileModuleServer();
}

// Start server if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createAgileModuleServer();
  server.startServer().catch(console.error);
}