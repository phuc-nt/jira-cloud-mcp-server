/**
 * Module Type Definitions for MCP Atlassian Server v4.0.0
 * Modular Architecture with 4 Specialized Modules
 */

export interface ModuleInfo {
  name: string;
  version: string;
  toolCount: number;
  description: string;
  memoryReduction: string;
  useCase: string;
}

export const MODULE_DEFINITIONS: Record<string, ModuleInfo> = {
  core: {
    name: 'Core',
    version: '4.0.0',
    toolCount: 14,
    description: 'Essential CRUD operations for issues, filters, versions + helper tools',
    memoryReduction: '69%',
    useCase: 'Basic integrations, essential operations, workflow support'
  },
  agile: {
    name: 'Agile',
    version: '4.0.0', 
    toolCount: 10,
    description: 'Sprint management, board operations, and backlog tools',
    memoryReduction: '79%',
    useCase: 'Agile teams, sprint workflows'
  },
  dashboard: {
    name: 'Dashboard',
    version: '4.0.0',
    toolCount: 8,
    description: 'Dashboard CRUD and gadget management for analytics',
    memoryReduction: '83%',
    useCase: 'Analytics, reporting, dashboard management'
  },
  search: {
    name: 'Search',
    version: '4.0.0',
    toolCount: 18,
    description: 'Read-only operations for data retrieval and analysis',
    memoryReduction: '62%',
    useCase: 'Data analysis, read-only integrations'
  }
};

export enum ModuleType {
  CORE = 'core',
  AGILE = 'agile', 
  DASHBOARD = 'dashboard',
  SEARCH = 'search'
}

export interface ToolRegistration {
  moduleName: string;
  toolName: string;
  isReadOnly: boolean;
  category: 'issues' | 'projects' | 'users' | 'boards' | 'sprints' | 'filters' | 'dashboards' | 'versions' | 'gadgets';
}