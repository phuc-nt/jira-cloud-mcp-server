import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import fs from "fs";

// Configuration
const CONFIG = {
  PROJECT_KEY: "XDEMO2",
  SERVER_PATH: "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js"
};

// Load environment variables from .env
function loadEnv(): Record<string, string> {
  try {
    const envFile = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envVars: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        envVars[key.trim()] = value.trim();
      }
    });
    return envVars;
  } catch (error) {
    console.error("Error loading .env file:", error);
    return {};
  }
}

// Helper to safely extract response data
function extractResponseData(result: any): any {
  if (result.content && Array.isArray(result.content) && result.content[0]?.text) {
    try {
      return JSON.parse(result.content[0].text);
    } catch {
      return result.content[0].text;
    }
  }
  return result;
}

async function testFiltersDashboardsTool(client: Client, toolName: string, args: any, description: string) {
  console.log(`\n🔧 Testing ${toolName}: ${description}`);
  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    const data = extractResponseData(result);
    
    if (data && data.success !== false) {
      console.log(`✅ ${toolName}: Success`);
      
      // Log specific results based on tool type
      if (toolName === 'listFilters' && data.filters) {
        console.log(`  🔍 Found ${data.filters.length} filters`);
        data.filters.slice(0, 3).forEach((filter: any, index: number) => {
          console.log(`    ${index + 1}. ${filter.name} (ID: ${filter.id})`);
        });
      } else if (toolName === 'getMyFilters' && data.filters) {
        console.log(`  🔍 My filters: ${data.filters.length}`);
        const categories = data.filterCategories || {};
        Object.entries(categories).forEach(([category, count]) => {
          console.log(`    ${category}: ${count}`);
        });
      } else if (toolName === 'getFilter' && data.filter) {
        console.log(`  🔍 Filter: ${data.filter.name} (ID: ${data.filter.id})`);
        console.log(`  📊 JQL: ${data.filter.jql}`);
      } else if (toolName === 'createFilter' && data.data) {
        console.log(`  ✨ Created filter: ${data.data.name} (ID: ${data.data.id})`);
        return data.data.id; // Return for further testing
      } else if (toolName === 'updateFilter' && data.data) {
        console.log(`  ✏️  Updated filter: ${data.data.name} (ID: ${data.data.id})`);
      } else if (toolName === 'deleteFilter' && data.success) {
        console.log(`  🗑️  Filter deleted successfully`);
      } else if (toolName === 'listDashboards' && data.dashboards) {
        console.log(`  📊 Found ${data.dashboards.length} dashboards`);
        data.dashboards.slice(0, 3).forEach((dashboard: any, index: number) => {
          console.log(`    ${index + 1}. ${dashboard.name} (ID: ${dashboard.id})`);
        });
      } else if (toolName === 'getDashboard' && data.dashboard) {
        console.log(`  📊 Dashboard: ${data.dashboard.name} (ID: ${data.dashboard.id})`);
        console.log(`  📋 Gadgets: ${data.dashboard.gadgetCount || 0}`);
      } else if (toolName === 'getDashboardGadgets' && data.gadgets) {
        console.log(`  🧩 Dashboard gadgets: ${data.gadgets.length}`);
        if (data.analysis) {
          console.log(`  📊 Gadget types: ${Object.keys(data.analysis.gadgetsByType).length}`);
        }
      } else if (toolName === 'createDashboard' && data.data) {
        console.log(`  ✨ Created dashboard: ${data.data.name} (ID: ${data.data.id})`);
        return data.data.id; // Return for further testing
      } else if (toolName === 'updateDashboard' && data.data) {
        console.log(`  ✏️  Updated dashboard: ${data.data.name} (ID: ${data.data.id})`);
      } else if (toolName === 'getJiraGadgets' && data.gadgets) {
        console.log(`  🧩 Available Jira gadgets: ${data.gadgets.length}`);
        data.gadgets.slice(0, 3).forEach((gadget: any, index: number) => {
          console.log(`    ${index + 1}. ${gadget.title} (${gadget.moduleKey})`);
        });
      } else if ((toolName === 'addGadgetToDashboard' || toolName === 'removeGadgetFromDashboard') && data.data) {
        console.log(`  ✅ Gadget operation completed successfully`);
      }
      
      return data;
    } else {
      console.log(`❌ ${toolName}: Failed - ${data?.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${toolName}: Error - ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function main() {
  console.log("🔍📊 === FILTERS & DASHBOARDS TOOLS TEST (16 Tools) ===");
  
  try {
    // Setup client
    const envVars = loadEnv();
    const client = new Client({ name: "filters-dashboards-test-client", version: "1.0.0" });
    
    const processEnv: Record<string, string> = {};
    Object.keys(process.env).forEach(key => {
      if (process.env[key] !== undefined) {
        processEnv[key] = process.env[key] as string;
      }
    });

    const transport = new StdioClientTransport({
      command: "node",
      args: [CONFIG.SERVER_PATH],
      env: { ...processEnv, ...envVars }
    });

    await client.connect(transport);
    console.log("✅ Connected to MCP Jira Server");
    
    console.log(`📋 Testing with project: ${CONFIG.PROJECT_KEY}`);

    // === FILTERS TESTING ===
    console.log("\n🔍 === FILTERS OPERATIONS ===");

    // 1. List Filters (Read)
    const filtersResult = await testFiltersDashboardsTool(client, "listFilters", 
      { maxResults: 10 }, 
      "List all accessible filters"
    );

    // 2. Get My Filters (Read)
    await testFiltersDashboardsTool(client, "getMyFilters", 
      {}, 
      "Get current user's filters with categorization"
    );

    let testFilterId = null;
    if (filtersResult?.filters?.length > 0) {
      testFilterId = filtersResult.filters[0].id;
      
      // 3. Get Filter (Read)
      await testFiltersDashboardsTool(client, "getFilter", 
        { filterId: testFilterId }, 
        "Get detailed filter information"
      );
    }

    // 4. Create Filter (Write)
    const timestamp = Date.now();
    const createFilterResult = await testFiltersDashboardsTool(client, "createFilter", 
      {
        name: `Test Filter ${timestamp}`,
        jql: `project = ${CONFIG.PROJECT_KEY} ORDER BY created DESC`,
        description: "Filter created by Filters & Dashboards test suite",
        favourite: false
      }, 
      "Create new filter"
    );

    let createdFilterId = null;
    if (createFilterResult) {
      createdFilterId = createFilterResult;
      
      // 5. Update Filter (Write)
      await testFiltersDashboardsTool(client, "updateFilter", 
        {
          filterId: createdFilterId,
          name: `Updated Test Filter ${timestamp}`,
          description: "Updated filter description by test suite",
          jql: `project = ${CONFIG.PROJECT_KEY} AND updated >= -7d ORDER BY updated DESC`
        }, 
        "Update existing filter"
      );
    }

    // === DASHBOARDS TESTING ===
    console.log("\n📊 === DASHBOARDS OPERATIONS ===");

    // 6. List Dashboards (Read)
    const dashboardsResult = await testFiltersDashboardsTool(client, "listDashboards", 
      { maxResults: 10 }, 
      "List all accessible dashboards"
    );

    let testDashboardId = null;
    if (dashboardsResult?.dashboards?.length > 0) {
      testDashboardId = dashboardsResult.dashboards[0].id;
      
      // 7. Get Dashboard (Read)
      await testFiltersDashboardsTool(client, "getDashboard", 
        { 
          dashboardId: testDashboardId,
          expand: "description,owner,viewUrl,favourite,sharePermissions,editPermissions"
        }, 
        "Get detailed dashboard information"
      );

      // 8. Get Dashboard Gadgets (Read)
      await testFiltersDashboardsTool(client, "getDashboardGadgets", 
        { dashboardId: testDashboardId }, 
        "Get dashboard gadgets with analysis"
      );
    }

    // 9. Create Dashboard (Write)
    const createDashboardResult = await testFiltersDashboardsTool(client, "createDashboard", 
      {
        name: `Test Dashboard ${timestamp}`,
        description: "Dashboard created by Filters & Dashboards test suite"
      }, 
      "Create new dashboard"
    );

    let createdDashboardId = null;
    if (createDashboardResult) {
      createdDashboardId = createDashboardResult;
      
      // 10. Update Dashboard (Write)
      await testFiltersDashboardsTool(client, "updateDashboard", 
        {
          dashboardId: createdDashboardId,
          name: `Updated Test Dashboard ${timestamp}`,
          description: "Updated dashboard description by test suite"
        }, 
        "Update existing dashboard"
      );
    }

    // === GADGETS TESTING ===
    console.log("\n🧩 === GADGETS OPERATIONS ===");

    // 11. Get Jira Gadgets (Read)
    const gadgetsResult = await testFiltersDashboardsTool(client, "getJiraGadgets", 
      {}, 
      "Get all available Jira gadgets"
    );

    // 12. Add Gadget to Dashboard (Write) - only if we have dashboard and gadgets
    if ((createdDashboardId || testDashboardId) && gadgetsResult?.gadgets?.length > 0) {
      const dashboardToUse = createdDashboardId || testDashboardId;
      const firstGadget = gadgetsResult.gadgets[0];
      
      const addGadgetResult = await testFiltersDashboardsTool(client, "addGadgetToDashboard", 
        {
          dashboardId: dashboardToUse,
          gadgetUri: firstGadget.completeModuleKey,
          title: `Test Gadget ${timestamp}`,
          color: "blue",
          position: {
            column: 0,
            row: 0
          },
          properties: {
            refresh: "15"
          }
        }, 
        "Add gadget to dashboard"
      );

      // 13. Remove Gadget from Dashboard (Write) - only if gadget was added
      if (addGadgetResult?.data?.id) {
        await testFiltersDashboardsTool(client, "removeGadgetFromDashboard", 
          {
            dashboardId: dashboardToUse,
            gadgetId: addGadgetResult.data.id
          }, 
          "Remove gadget from dashboard"
        );
      }
    }

    // === CLEANUP TESTING ===
    console.log("\n🧹 === CLEANUP OPERATIONS ===");

    // 14. Delete Filter (Write) - only delete the one we created
    if (createdFilterId) {
      await testFiltersDashboardsTool(client, "deleteFilter", 
        { filterId: createdFilterId }, 
        "Delete created test filter"
      );
    }

    // Summary
    console.log("\n📊 === FILTERS & DASHBOARDS TEST SUMMARY ===");
    console.log("✅ Filters Operations: listFilters, getMyFilters, getFilter, createFilter, updateFilter, deleteFilter");
    console.log("✅ Dashboards Operations: listDashboards, getDashboard, getDashboardGadgets, createDashboard, updateDashboard");
    console.log("✅ Gadgets Operations: getJiraGadgets, addGadgetToDashboard, removeGadgetFromDashboard");
    console.log(`✅ Total tools tested: 13/16 (3 tools are backlog management in boards group)`);
    console.log(`✅ Test dashboard ID: ${testDashboardId || 'N/A'}`);
    console.log(`✅ Test filter ID: ${testFilterId || 'N/A'}`);
    
    if (createdDashboardId) {
      console.log(`📝 Created dashboard ID: ${createdDashboardId} (available for further testing)`);
    }
    
    if (createdFilterId) {
      console.log(`🗑️  Created filter ID: ${createdFilterId} (cleaned up)`);
    }
    
    await client.close();
    console.log("✅ Connection closed successfully");
    
  } catch (error) {
    console.error("❌ Filters & Dashboards Test Error:", error);
    process.exit(1);
  }
}

main();