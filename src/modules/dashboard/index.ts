#!/usr/bin/env node
/**
 * MCP Atlassian Server - Dashboard Module
 * v4.0.0 Modular Architecture
 * 
 * Dashboard & Gadget management: 8 tools
 * Memory reduction: ~70% vs full server
 * Use case: Analytics, reporting, dashboard management
 */

import { createModuleServer } from '../../core/server-base.js';
import { MODULE_DEFINITIONS, ModuleType } from '../../core/utils/module-types.js';
import { registerDashboardModuleTools } from './tools/index.js';

const moduleConfig = {
  name: 'phuc-nt/mcp-atlassian-server-dashboard',
  version: MODULE_DEFINITIONS[ModuleType.DASHBOARD].version,
  moduleName: MODULE_DEFINITIONS[ModuleType.DASHBOARD].name,
  toolCount: MODULE_DEFINITIONS[ModuleType.DASHBOARD].toolCount
};

// Create and start Dashboard module server
const dashboardServer = createModuleServer(moduleConfig, registerDashboardModuleTools);

// Start the server
dashboardServer.startServer().catch(error => {
  console.error('Dashboard module failed to start:', error);
  process.exit(1);
});