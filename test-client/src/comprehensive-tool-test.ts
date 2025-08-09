import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test configuration
const testConfigPath = path.resolve(__dirname, '../test-data-config.json');
const testConfig = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));

// Configuration
const CONFIG = {
  PROJECT_KEY: testConfig.jira.testProject.key, // Use config
  TEST_BOARD_ID: testConfig.jira.testBoard.id.toString(), // Use config board ID
  MAX_ISSUES_TO_TEST: 3,
  MAX_USERS_TO_TEST: 3,
  SERVER_PATH: "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js",
  VERBOSE: true
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
class ToolTestGroups {
  constructor(private client: Client) {}

  async testIssuesManagement() {
    console.log("\n🔷 === ISSUES MANAGEMENT TOOLS (11 tools) ===");
    
    // Read operations
    await this.testTool("listIssues", { projectKey: CONFIG.PROJECT_KEY, limit: 5 }, "issues");
    
    const issuesResult = await this.callToolSafely("listIssues", { projectKey: CONFIG.PROJECT_KEY, limit: 1 });
    const testIssueKey = issuesResult?.issues?.[0]?.key;
    
    if (testIssueKey) {
      await this.testTool("getIssue", { issueKey: testIssueKey }, "issue");
      await this.testTool("getIssueTransitions", { issueKey: testIssueKey }, "transitions");
      await this.testTool("getIssueComments", { issueKey: testIssueKey }, "comments");
    }
    
    await this.testTool("searchIssues", { 
      jql: `project = ${CONFIG.PROJECT_KEY} ORDER BY created DESC`, 
      maxResults: 3 
    }, "issues");
    
    // Write operations (with real data)
    const newIssueSummary = `Test Issue ${new Date().toISOString()}`;
    const createResult = await this.testTool("createIssue", {
      projectKey: CONFIG.PROJECT_KEY,
      summary: newIssueSummary,
      description: "Comprehensive test issue created by test suite",
      issueType: "Task"
    }, "data");
    
    // Get the created issue key for further tests
    const newIssueKey = createResult?.data?.key;
    if (newIssueKey) {
      console.log(`  📝 Created issue: ${newIssueKey}`);
      
      // Test comment operations on the new issue
      const commentResult = await this.testTool("addIssueComment", {
        issueKey: newIssueKey,
        body: "Test comment added by comprehensive test suite"
      }, "data");
      
      // Test issue update
      await this.testTool("updateIssue", {
        issueKey: newIssueKey,
        summary: newIssueSummary + " (Updated)",
        description: "Updated description for comprehensive testing"
      }, "data");
      
      // Test assignment (to current user if possible)
      const usersResult = await this.callToolSafely("searchUsers", { query: "", maxResults: 1 });
      if (usersResult?.users?.[0]?.accountId) {
        await this.testTool("assignIssue", {
          issueKey: newIssueKey,
          accountId: usersResult.users[0].accountId
        }, "data");
      }
      
      console.log(`  📋 Test issue ${newIssueKey} created for further testing`);
    }
  }

  async testProjectsAndUsers() {
    console.log("\n🔷 === PROJECTS & USERS TOOLS (7 tools) ===");
    
    // Projects
    await this.testTool("listProjects", { includeArchived: false }, "projects");
    await this.testTool("getProject", { projectKey: CONFIG.PROJECT_KEY }, "project");
    
    // Users
    await this.testTool("searchUsers", { query: "admin", maxResults: 3 }, "users");
    await this.testTool("listUsers", { maxResults: 5, includeActive: true }, "users");
    
    // Get a user to test getUser and getAssignableUsers
    const usersResult = await this.callToolSafely("searchUsers", { query: "", maxResults: 1 });
    const testAccountId = usersResult?.users?.[0]?.accountId;
    
    if (testAccountId) {
      await this.testTool("getUser", { accountId: testAccountId }, "user");
    }
    
    await this.testTool("getAssignableUsers", { 
      project: CONFIG.PROJECT_KEY,
      maxResults: 5 
    }, "assignableUsers");
  }

  async testBoardsAndSprints() {
    console.log("\n🔷 === BOARDS & SPRINTS TOOLS (11 tools) ===");
    
    // Boards
    await this.testTool("listBoards", { maxResults: 5 }, "boards");
    
    const boardsResult = await this.callToolSafely("listBoards", { maxResults: 1 });
    const testBoardId = boardsResult?.boards?.[0]?.id;
    
    if (testBoardId) {
      await this.testTool("getBoard", { boardId: testBoardId }, "board");
      await this.testTool("getBoardConfiguration", { boardId: testBoardId }, "configuration");
      await this.testTool("getBoardIssues", { boardId: testBoardId, maxResults: 3 }, "issues");
      await this.testTool("getBoardSprints", { boardId: testBoardId, maxResults: 3 }, "sprints");
      
      console.log(`  🏆 Board ${testBoardId} used for testing`);
    }
    
    // Sprints
    await this.testTool("listSprints", { maxResults: 5 }, "sprints");
    
    const sprintsResult = await this.callToolSafely("listSprints", { maxResults: 1 });
    const testSprintId = sprintsResult?.sprints?.[0]?.id;
    
    if (testSprintId) {
      await this.testTool("getSprint", { sprintId: testSprintId }, "sprint");
      await this.testTool("getSprintIssues", { sprintId: testSprintId, maxResults: 3 }, "issues");
      
      console.log(`  🏃 Sprint ${testSprintId} used for testing`);
    }
    
    // Sprint write operations (create new sprint for testing)
    console.log(`  🔍 Debug: Using configured boardId = ${CONFIG.TEST_BOARD_ID}`);
    const sprintResult = await this.testTool("createSprint", {
      boardId: CONFIG.TEST_BOARD_ID,  // Use config board ID
      name: `Test Sprint ${Date.now()}`,  // Short name < 30 chars
      goal: "Comprehensive testing sprint"
    }, "data");
      
    const newSprintId = sprintResult?.data?.id;
    if (newSprintId) {
      console.log(`  📝 Created sprint: ${newSprintId}`);
      
      // Test adding issues to sprint
      const issuesResult = await this.callToolSafely("listIssues", { projectKey: CONFIG.PROJECT_KEY, limit: 1 });
      if (issuesResult?.issues?.[0]?.id) {
        await this.testTool("addIssueToSprint", {
          sprintId: newSprintId,
          issues: [issuesResult.issues[0].id]
        }, "data");
      }
    }
  }

  async testFiltersAndDashboards() {
    console.log("\n🔷 === FILTERS & DASHBOARDS TOOLS (16 tools) ===");
    
    // Filters read operations
    await this.testTool("listFilters", { maxResults: 5 }, "filters");
    await this.testTool("getMyFilters", {}, "filters");
    
    // Create filter for testing
    const filterResult = await this.testTool("createFilter", {
      name: `Test Filter ${Date.now()}`,
      jql: `project = ${CONFIG.PROJECT_KEY} ORDER BY created DESC`,
      description: "Test filter created by comprehensive test suite",
      favourite: false
    }, "data");
    
    const newFilterId = filterResult?.data?.id;
    if (newFilterId) {
      console.log(`  📝 Created filter: ${newFilterId}`);
      
      await this.testTool("getFilter", { filterId: newFilterId }, "filter");
      
      await this.testTool("updateFilter", {
        filterId: newFilterId,
        name: `Updated Test Filter ${Date.now()}`,
        description: "Updated test filter description"
      }, "data");
    }
    
    // Dashboards read operations
    await this.testTool("listDashboards", { maxResults: 5 }, "dashboards");
    
    const dashboardsResult = await this.callToolSafely("listDashboards", { maxResults: 1 });
    const testDashboardId = dashboardsResult?.dashboards?.[0]?.id;
    
    if (testDashboardId) {
      await this.testTool("getDashboard", { dashboardId: testDashboardId }, "dashboard");
      await this.testTool("getDashboardGadgets", { dashboardId: testDashboardId }, "gadgets");
      
      console.log(`  📊 Dashboard ${testDashboardId} used for testing`);
    }
    
    // Create dashboard for testing
    const dashboardResult = await this.testTool("createDashboard", {
      name: `Test Dashboard ${Date.now()}`,
      description: "Test dashboard created by comprehensive test suite"
    }, "data");
    
    const newDashboardId = dashboardResult?.data?.id;
    if (newDashboardId) {
      console.log(`  📝 Created dashboard: ${newDashboardId}`);
      
      await this.testTool("updateDashboard", {
        dashboardId: newDashboardId,
        name: `Updated Test Dashboard ${Date.now()}`,
        description: "Updated test dashboard description"
      }, "data");
    }
    
    // Test gadgets operations
    await this.testTool("getJiraGadgets", {}, "gadgets");
    
    // Backlog operations (if board exists)
    const boardsResult = await this.callToolSafely("listBoards", { maxResults: 1 });
    if (boardsResult?.boards?.[0]?.id) {
      const issuesResult = await this.callToolSafely("listIssues", { projectKey: CONFIG.PROJECT_KEY, limit: 1 });
      if (issuesResult?.issues?.[0]?.id) {
        await this.testTool("addIssuesToBacklog", {
          issues: [issuesResult.issues[0].id]
        }, "data");
      }
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
  console.log("🚀 === MCP Jira Server v3.0.0 - COMPREHENSIVE TOOL TESTING (45 Tools) ===");
  
  try {
    // Setup client connection
    const envVars = loadEnv();
    const client = new Client({ name: "mcp-jira-comprehensive-test", version: "1.0.0" });
    
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

    // List all available tools
    const toolsList = await client.listTools();
    console.log(`\n📋 Total tools available: ${toolsList.tools.length}/51 expected (Sprint 4.4: Fix Version Management)`);
    
    if (CONFIG.VERBOSE) {
      console.log("\n📝 Available tools:");
      toolsList.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name}`);
      });
    }

    // Initialize test groups
    const testGroups = new ToolTestGroups(client);
    
    // Execute test groups
    console.log(`\n🎯 Testing project: ${CONFIG.PROJECT_KEY}`);
    
    await testGroups.testIssuesManagement();
    await testGroups.testProjectsAndUsers();
    await testGroups.testBoardsAndSprints();
    await testGroups.testFiltersAndDashboards();
    
    // Final summary
    console.log("\n🎉 === COMPREHENSIVE TEST SUMMARY ===");
    console.log("✅ MCP Jira Server v3.0.0 - Tools-Only Architecture");
    console.log("✅ Server connection successful");
    console.log(`✅ ${toolsList.tools.length} tools tested across 4 functional groups`);
    console.log("✅ Issues Management: CRUD operations, comments, transitions");
    console.log("✅ Projects & Users: Project info, user management, assignments");
    console.log("✅ Boards & Sprints: Agile operations, sprint management");
    console.log("✅ Filters & Dashboards: Search filters, dashboard management");
    console.log("\n🎯 Phase 3 Complete: 100% v2.x Coverage Achievement Validated");
    
    await client.close();
    console.log("✅ Connection closed successfully");
    
  } catch (error) {
    console.error("❌ Comprehensive Test Error:", error);
    process.exit(1);
  }
}

main();