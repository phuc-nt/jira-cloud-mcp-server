#!/usr/bin/env node
/**
 * MCP Atlassian Server - Search Module
 * v4.0.0 Modular Architecture
 * 
 * Advanced search operations: 13 tools
 * Memory reduction: ~70% vs full server
 * Use case: Search, discovery, query operations
 */

import { createModuleServer } from '../../core/server-base.js';
import { MODULE_DEFINITIONS, ModuleType } from '../../core/utils/module-types.js';
import { registerSearchModuleTools } from './tools/index.js';

const moduleConfig = {
  name: 'phuc-nt/mcp-atlassian-server-search',
  version: MODULE_DEFINITIONS[ModuleType.SEARCH].version,
  moduleName: MODULE_DEFINITIONS[ModuleType.SEARCH].name,
  toolCount: MODULE_DEFINITIONS[ModuleType.SEARCH].toolCount
};

// Create and start Search module server
const searchServer = createModuleServer(moduleConfig, registerSearchModuleTools);

// Start the server
searchServer.startServer().catch(error => {
  console.error('Search module failed to start:', error);
  process.exit(1);
});