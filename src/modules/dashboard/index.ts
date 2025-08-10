#!/usr/bin/env node
/**
 * Dashboard Module Entry Point
 * 8 Dashboard & Gadget Management Tools
 * Memory optimized for Analytics & Reporting
 */

import { BaseModuleServer } from '../../core/server-base.js';
import { registerDashboardModuleTools } from './tools/index.js';
import { MODULE_DEFINITIONS } from '../../core/utils/module-types.js';

class DashboardModuleServer extends BaseModuleServer {
  constructor() {
    super({
      name: 'mcp-jira-dashboard',
      version: '4.0.0-alpha.1',
      moduleName: 'Dashboard',
      toolCount: 8
    });
  }

  protected registerModuleTools(): void {
    registerDashboardModuleTools(this.server);
  }
}

// Create and start the Dashboard module server
export function createDashboardModuleServer() {
  return new DashboardModuleServer();
}

// Start server if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createDashboardModuleServer();
  server.startServer().catch(console.error);
}