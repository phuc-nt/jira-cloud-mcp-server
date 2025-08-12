#!/usr/bin/env node
/**
 * MCP Atlassian Server - Agile Module
 * v4.0.0 Modular Architecture
 * 
 * Sprint & Board management: 10 tools
 * Memory reduction: ~70% vs full server
 * Use case: Agile workflows, sprint planning, board management
 */

import { createModuleServer } from '../../core/server-base.js';
import { MODULE_DEFINITIONS, ModuleType } from '../../core/utils/module-types.js';
import { registerAgileModuleTools } from './tools/index.js';

const moduleConfig = {
  name: 'phuc-nt/mcp-atlassian-server-agile',
  version: MODULE_DEFINITIONS[ModuleType.AGILE].version,
  moduleName: MODULE_DEFINITIONS[ModuleType.AGILE].name,
  toolCount: MODULE_DEFINITIONS[ModuleType.AGILE].toolCount
};

// Create and start Agile module server
const agileServer = createModuleServer(moduleConfig, registerAgileModuleTools);

// Start the server
agileServer.startServer().catch(error => {
  console.error('Agile module failed to start:', error);
  process.exit(1);
});