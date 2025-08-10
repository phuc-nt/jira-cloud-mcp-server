/**
 * MCP Atlassian Server - Core Module
 * v4.0.0 Modular Architecture
 * 
 * Essential CRUD operations: 12 tools
 * Memory reduction: ~75% vs full server
 * Use case: Basic integrations, essential operations
 */

import { createModuleServer } from '../../core/server-base.js';
import { MODULE_DEFINITIONS, ModuleType } from '../../core/utils/module-types.js';
import { registerCoreModuleTools } from './tools/index.js';

const moduleConfig = {
  name: 'phuc-nt/mcp-atlassian-server-core',
  version: MODULE_DEFINITIONS[ModuleType.CORE].version,
  moduleName: MODULE_DEFINITIONS[ModuleType.CORE].name,
  toolCount: MODULE_DEFINITIONS[ModuleType.CORE].toolCount
};

// Create and start Core module server
const coreServer = createModuleServer(moduleConfig, registerCoreModuleTools);

// Start the server
coreServer.startServer().catch(error => {
  console.error('Core module failed to start:', error);
  process.exit(1);
});