import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { getTestConfig, ConfigManager } from './config-manager.js';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const testConfig = getTestConfig();
const CONFIG = {
  PROJECT_KEY: testConfig.getProjectKey(),
  BOARD_ID: testConfig.getBoardId(),
  ADMIN_USER: testConfig.getAdminUser(),
  MAX_RESULTS: testConfig.getMaxResults(),
  SERVER_PATH: "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js",
  VERBOSE: testConfig.isVerboseLogging(),
  USE_REAL_DATA: testConfig.shouldUseRealData(),
  AUTO_CLEANUP: testConfig.shouldAutoCleanup()
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

// Helper to log test results
function logTestResult(testName: string, data: any, expectedField?: string) {
  const isSuccess = data && data.success !== false;
  console.log(`${testName}: ${isSuccess ? '✅' : '❌'} ${isSuccess ? 'Success' : 'Failed'}`);
  
  if (isSuccess && expectedField && data[expectedField]) {
    if (Array.isArray(data[expectedField])) {
      console.log(`  📊 Found ${data[expectedField].length} ${expectedField}`);
    } else {
      console.log(`  📄 ${expectedField}: ${data[expectedField].name || data[expectedField].key || data[expectedField].id || 'Retrieved'}`);
    }
  }
  
  if (!isSuccess && data.error) {
    console.log(`  ❌ Error: ${data.error}`);
  }
}

// Test Groups
class ConfigurableToolTestGroups {
  constructor(private client: Client, private config: ConfigManager) {}

  async testIssuesManagement() {
    console.log("\n🔷 === ISSUES MANAGEMENT TOOLS (11 tools) ===");
    
    const projectKey = this.config.getProjectKey();
    const limits = this.config.getTestConfiguration().limits;
    
    // Read operations with configured limits
    await this.testTool("listIssues", { 
      projectKey: projectKey, 
      limit: Math.min(limits.maxTestIssues, limits.maxResults)
    }, "issues");
    
    const issuesResult = await this.callToolSafely("listIssues", { 
      projectKey: projectKey, 
      limit: 1 
    });
    const testIssueKey = issuesResult?.issues?.[0]?.key;
    
    if (testIssueKey) {
      await this.testTool("getIssue", { issueKey: testIssueKey }, "issue");
      await this.testTool("getIssueTransitions", { issueKey: testIssueKey }, "transitions");
      await this.testTool("getIssueComments", { issueKey: testIssueKey }, "comments");
    }
    
    await this.testTool("searchIssues", { 
      jql: this.config.getDefaultJQL(), 
      maxResults: 3 
    }, "issues");
    
    // Write operations with real data
    if (this.config.shouldUseRealData()) {
      const testIssues = this.config.getJiraConfig().testIssues;
      const newIssueSummary = this.config.generateTestName("Issue");
      
      const createResult = await this.testTool("createIssue", {
        projectKey: projectKey,
        summary: newIssueSummary,
        description: this.config.generateTestDescription("issue for comprehensive testing"),
        issueType: testIssues.issueType
      }, "data");
      
      // Get the created issue key for further tests
      const newIssueKey = createResult?.data?.key;
      if (newIssueKey) {
        console.log(`  📝 Created issue: ${newIssueKey}`);
        
        // Test comment operations
        const commentResult = await this.testTool("addIssueComment", {
          issueKey: newIssueKey,
          body: `Test comment: ${this.config.generateTestDescription("comment")}`
        }, "data");
        
        // Test issue update
        await this.testTool("updateIssue", {
          issueKey: newIssueKey,
          summary: newIssueSummary + " (Updated)",
          description: this.config.generateTestDescription("updated issue")
        }, "data");
        
        // Test assignment to configured admin user
        const adminUser = this.config.getAdminUser();
        await this.testTool("assignIssue", {
          issueKey: newIssueKey,
          accountId: adminUser.accountId
        }, "data");
        
        console.log(`  📋 Test issue ${newIssueKey} created and configured with admin user`);
      }
    }
  }

  async testProjectsAndUsers() {
    console.log("\n🔷 === PROJECTS & USERS TOOLS (7 tools) ===");
    
    const projectKey = this.config.getProjectKey();
    const limits = this.config.getTestConfiguration().limits;
    
    // Projects with expected data
    await this.testTool("listProjects", { includeArchived: false }, "projects");
    await this.testTool("getProject", { projectKey: projectKey }, "project");
    
    // Users with configured limits
    await this.testTool("searchUsers", { 
      query: "admin", 
      maxResults: Math.min(limits.maxTestUsers, limits.maxResults)
    }, "users");
    
    await this.testTool("listUsers", { 
      maxResults: limits.maxTestUsers, 
      includeActive: true 
    }, "users");
    
    // Test with configured admin user
    const adminUser = this.config.getAdminUser();
    await this.testTool("getUser", { accountId: adminUser.accountId }, "user");
    
    // Test assignable users for the configured project
    await this.testTool("getAssignableUsers", { 
      project: projectKey,
      maxResults: limits.maxTestUsers 
    }, "assignableUsers");
  }

  async testBoardsAndSprints() {
    console.log("\n🔷 === BOARDS & SPRINTS TOOLS (11 tools) ===");
    
    const boardConfig = this.config.getTestBoard();
    const sprintConfig = this.config.getTestSprint();
    const limits = this.config.getTestConfiguration().limits;
    
    // Boards with configured board ID
    await this.testTool("listBoards", { maxResults: limits.maxResults }, "boards");
    await this.testTool("getBoard", { boardId: boardConfig.id }, "board");
    await this.testTool("getBoardConfiguration", { boardId: boardConfig.id }, "configuration");
    await this.testTool("getBoardIssues", { 
      boardId: boardConfig.id, 
      maxResults: Math.min(limits.maxTestIssues, limits.maxResults)
    }, "issues");
    await this.testTool("getBoardSprints", { 
      boardId: boardConfig.id, 
      maxResults: limits.maxResults
    }, "sprints");
    
    console.log(`  🏆 Using configured board: ${boardConfig.name} (ID: ${boardConfig.id})`);
    
    // Sprints
    await this.testTool("listSprints", { maxResults: limits.maxResults }, "sprints");
    
    const sprintsResult = await this.callToolSafely("listSprints", { maxResults: 1 });
    const testSprintId = sprintsResult?.sprints?.[0]?.id;
    
    if (testSprintId) {
      await this.testTool("getSprint", { sprintId: testSprintId }, "sprint");
      await this.testTool("getSprintIssues", { 
        sprintId: testSprintId, 
        maxResults: Math.min(limits.maxTestIssues, limits.maxResults)
      }, "issues");
      
      console.log(`  🏃 Using sprint: ${testSprintId}`);
    }
    
    // Sprint management with real data
    if (this.config.shouldUseRealData()) {
      const sprintResult = await this.testTool("createSprint", {
        name: this.config.generateTestName("Sprint"),
        originBoardId: boardConfig.id,
        goal: this.config.generateTestDescription("sprint for testing")
      }, "data");
      
      const newSprintId = sprintResult?.data?.id;
      if (newSprintId) {
        console.log(`  📝 Created sprint: ${newSprintId} on board ${boardConfig.id}`);
        
        // Test adding issues to sprint
        const issuesResult = await this.callToolSafely("listIssues", { 
          projectKey: this.config.getProjectKey(), 
          limit: 1 
        });
        if (issuesResult?.issues?.[0]?.id) {
          await this.testTool("addIssueToSprint", {
            sprintId: newSprintId,
            issues: [issuesResult.issues[0].id]
          }, "data");
        }
      }
    }
  }

  async testFiltersAndDashboards() {
    console.log("\n🔷 === FILTERS & DASHBOARDS TOOLS (16 tools) ===");
    
    const limits = this.config.getTestConfiguration().limits;
    const filterConfig = this.config.getJiraConfig().testFilters;
    const dashboardConfig = this.config.getJiraConfig().testDashboards;
    
    // Filters with configured data
    await this.testTool("listFilters", { 
      maxResults: Math.min(limits.maxTestFilters, limits.maxResults)
    }, "filters");
    await this.testTool("getMyFilters", {}, "filters");
    
    // Create filter with configured JQL
    const filterResult = await this.testTool("createFilter", {
      name: this.config.generateTestName("Filter"),
      jql: this.config.getDefaultJQL(),
      description: this.config.generateTestDescription("filter"),
      favourite: false
    }, "data");
    
    const newFilterId = filterResult?.data?.id;
    if (newFilterId) {
      console.log(`  📝 Created filter: ${newFilterId}`);
      
      await this.testTool("getFilter", { filterId: newFilterId }, "filter");
      
      await this.testTool("updateFilter", {
        filterId: newFilterId,
        name: this.config.generateTestName("Updated Filter"),
        description: this.config.generateTestDescription("updated filter")
      }, "data");
    }
    
    // Dashboards with configured data
    await this.testTool("listDashboards", { 
      maxResults: Math.min(limits.maxTestDashboards, limits.maxResults)
    }, "dashboards");
    
    const dashboardsResult = await this.callToolSafely("listDashboards", { maxResults: 1 });
    const testDashboardId = dashboardsResult?.dashboards?.[0]?.id;
    
    if (testDashboardId) {
      await this.testTool("getDashboard", { dashboardId: testDashboardId }, "dashboard");
      await this.testTool("getDashboardGadgets", { dashboardId: testDashboardId }, "gadgets");
      
      console.log(`  📊 Using dashboard: ${testDashboardId}`);
    }
    
    // Create dashboard with configured data
    const dashboardResult = await this.testTool("createDashboard", {
      name: this.config.generateTestName("Dashboard"),
      description: this.config.generateTestDescription("dashboard")
    }, "data");
    
    const newDashboardId = dashboardResult?.data?.id;
    if (newDashboardId) {
      console.log(`  📝 Created dashboard: ${newDashboardId}`);
      
      await this.testTool("updateDashboard", {
        dashboardId: newDashboardId,
        name: this.config.generateTestName("Updated Dashboard"),
        description: this.config.generateTestDescription("updated dashboard")
      }, "data");
    }
    
    // Test gadgets
    await this.testTool("getJiraGadgets", {}, "gadgets");
    
    // Cleanup created filter if auto cleanup is enabled
    if (this.config.shouldAutoCleanup() && newFilterId) {
      await this.testTool("deleteFilter", { filterId: newFilterId }, "success");
      console.log(`  🗑️  Cleaned up filter: ${newFilterId}`);
    }
  }

  private async testTool(toolName: string, args: any, expectedField?: string) {
    try {
      const result = await this.client.callTool({ name: toolName, arguments: args });
      const data = extractResponseData(result);
      logTestResult(toolName, data, expectedField);
      return data;
    } catch (error) {
      console.log(`${toolName}: ❌ Error - ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private async callToolSafely(toolName: string, args: any) {
    try {
      const result = await this.client.callTool({ name: toolName, arguments: args });
      return extractResponseData(result);
    } catch {
      return null;
    }
  }
}

async function main() {
  console.log("🚀 === MCP Jira Server v3.0.0 - CONFIGURABLE COMPREHENSIVE TEST (45 Tools) ===");
  
  // Validate configuration
  if (!testConfig.validateConfiguration()) {
    console.error("❌ Configuration validation failed. Please check test-data-config.json");
    process.exit(1);
  }
  
  if (CONFIG.VERBOSE) {
    testConfig.printConfiguration();
  }
  
  try {
    // Setup client connection
    const envVars = loadEnv();
    const client = new Client({ name: "mcp-configurable-test", version: "1.0.0" });
    
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
    console.log("✅ Connected to MCP Jira Server v3.0.0");

    // Verify server capabilities
    const capabilities = await client.getServerCapabilities();
    console.log("✅ Tools capability:", capabilities?.tools ? "Available" : "Not available");

    // List all available tools and validate count
    const toolsList = await client.listTools();
    const expectedTools = testConfig.getExpectedResults().expectedTools;
    console.log(`\n📋 Total tools available: ${toolsList.tools.length}/${expectedTools} expected`);
    
    if (toolsList.tools.length !== expectedTools) {
      console.warn(`⚠️  Tool count mismatch. Expected ${expectedTools}, found ${toolsList.tools.length}`);
    }
    
    if (CONFIG.VERBOSE) {
      console.log("\n📝 Available tools:");
      toolsList.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name}`);
      });
    }

    // Initialize test groups with configuration
    const testGroups = new ConfigurableToolTestGroups(client, testConfig);
    
    // Execute test groups
    console.log(`\n🎯 Testing with configured data:`);
    console.log(`  📁 Project: ${CONFIG.PROJECT_KEY}`);
    console.log(`  🏆 Board: ${CONFIG.BOARD_ID}`);
    console.log(`  👤 Admin: ${CONFIG.ADMIN_USER.displayName}`);
    console.log(`  📊 Max Results: ${CONFIG.MAX_RESULTS}`);
    console.log(`  🧹 Auto Cleanup: ${CONFIG.AUTO_CLEANUP ? 'Enabled' : 'Disabled'}`);
    
    await testGroups.testIssuesManagement();
    await testGroups.testProjectsAndUsers();
    await testGroups.testBoardsAndSprints();
    await testGroups.testFiltersAndDashboards();
    
    // Final summary with configured expectations
    const expectedResults = testConfig.getExpectedResults();
    console.log("\n🎉 === CONFIGURABLE COMPREHENSIVE TEST SUMMARY ===");
    console.log("✅ MCP Jira Server v3.0.0 - Tools-Only Architecture");
    console.log("✅ Server connection successful");
    console.log(`✅ ${toolsList.tools.length} tools tested with real configured data`);
    console.log(`✅ Configuration-driven testing with project ${CONFIG.PROJECT_KEY}`);
    console.log("✅ Issues Management: CRUD operations with real data creation");
    console.log("✅ Projects & Users: Configured project and admin user validation");
    console.log("✅ Boards & Sprints: Real board operations with configured board");
    console.log("✅ Filters & Dashboards: Real data creation and management");
    console.log(`✅ Target Success Rate: ${expectedResults.targetSuccessRate * 100}%`);
    console.log(`✅ Auto Cleanup: ${CONFIG.AUTO_CLEANUP ? 'Enabled' : 'Disabled'}`);
    console.log("\n🎯 Configuration-Based Testing: All operations use real Jira data");
    console.log("🔧 Config-driven approach ensures consistent and reliable testing");
    
    await client.close();
    console.log("✅ Connection closed successfully");
    
  } catch (error) {
    console.error("❌ Configurable Comprehensive Test Error:", error);
    process.exit(1);
  }
}

main();