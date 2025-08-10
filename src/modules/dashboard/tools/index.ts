/**
 * Dashboard Module Tool Registration
 * 8 Dashboard & Gadget Management Tools
 */

// Dashboard CRUD operations
import { registerCreateDashboardTool } from '../../../tools/jira/create-dashboard.js';
import { registerUpdateDashboardTool } from '../../../tools/jira/update-dashboard.js';
import { registerGetDashboardTool } from '../../../tools/jira/get-dashboard.js';
import { registerListDashboardsTool } from '../../../tools/jira/list-dashboards.js';

// Gadget Management tools
import { registerGetDashboardGadgetsTool } from '../../../tools/jira/get-dashboard-gadgets.js';
import { registerAddGadgetToDashboardTool } from '../../../tools/jira/add-gadget-to-dashboard.js';
import { registerRemoveGadgetFromDashboardTool } from '../../../tools/jira/remove-gadget-from-dashboard.js';
import { registerGetJiraGadgetsTool } from '../../../tools/jira/get-gadgets-new.js';

export function registerDashboardModuleTools(server: any) {
  // Dashboard CRUD Operations (4 tools)
  registerCreateDashboardTool(server);           // 1. Create new dashboards
  registerUpdateDashboardTool(server);           // 2. Update dashboard details
  registerGetDashboardTool(server);              // 3. Get dashboard information
  registerListDashboardsTool(server);            // 4. List available dashboards
  
  // Gadget Management (4 tools)
  registerGetDashboardGadgetsTool(server);       // 5. Get dashboard gadgets
  registerAddGadgetToDashboardTool(server);      // 6. Add gadgets to dashboard
  registerRemoveGadgetFromDashboardTool(server); // 7. Remove gadgets from dashboard
  registerGetJiraGadgetsTool(server);            // 8. Get available gadgets
}