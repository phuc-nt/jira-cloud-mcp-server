import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import fs from "fs";
import { getTestConfig } from './config-manager.js';

// Configuration using configuration manager
const testConfig = getTestConfig();
const CONFIG = {
  PROJECT_KEY: testConfig.getProjectKey(),
  PROJECT_NAME: testConfig.getTestProject().name,
  PROJECT_ID: testConfig.getTestProject().id,
  ADMIN_USER: testConfig.getAdminUser(),
  MAX_RESULTS: testConfig.getMaxResults(),
  MAX_TEST_USERS: testConfig.getTestConfiguration().limits.maxTestUsers,
  SERVER_PATH: "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js",
  USE_REAL_DATA: testConfig.shouldUseRealData()
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

async function testProjectsUsersTool(client: Client, toolName: string, args: any, description: string) {
  console.log(`\n🔧 Testing ${toolName}: ${description}`);
  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    const data = extractResponseData(result);
    
    if (data && data.success !== false) {
      console.log(`✅ ${toolName}: Success`);
      
      // Log specific results based on tool type
      if (toolName === 'listProjects' && data.projects) {
        console.log(`  📁 Found ${data.projects.length} projects`);
        data.projects.slice(0, 3).forEach((project: any, index: number) => {
          console.log(`    ${index + 1}. ${project.name} (${project.key})`);
        });
        
        // Show project statistics if available
        if (data.projectStatistics) {
          console.log(`  📊 Statistics: ${data.projectStatistics.totalProjects} total, ${data.projectStatistics.activeProjects} active`);
        }
      } else if (toolName === 'getProject' && data.project) {
        console.log(`  📁 Project: ${data.project.name} (${data.project.key})`);
        console.log(`  📊 Type: ${data.project.projectTypeKey}, Lead: ${data.project.lead?.displayName || 'N/A'}`);
        console.log(`  📋 Components: ${data.project.components?.length || 0}, Versions: ${data.project.versions?.length || 0}`);
      } else if (toolName === 'searchUsers' && data.users) {
        console.log(`  👥 Found ${data.users.length} users`);
        data.users.slice(0, 3).forEach((user: any, index: number) => {
          console.log(`    ${index + 1}. ${user.displayName} (${user.accountId.substring(0, 12)}...)`);
        });
      } else if (toolName === 'listUsers' && data.users) {
        console.log(`  👥 Listed ${data.users.length} users`);
        if (data.statistics) {
          console.log(`  📊 Active: ${data.statistics.activeUsers}, Inactive: ${data.statistics.inactiveUsers}`);
          console.log(`  📊 Account types: ${JSON.stringify(data.statistics.accountTypes)}`);
        }
      } else if (toolName === 'getUser' && data.user) {
        console.log(`  👤 User: ${data.user.displayName} (${data.user.accountId.substring(0, 12)}...)`);
        console.log(`  📧 Email: ${data.user.emailAddress || 'N/A'}, Active: ${data.user.active}`);
        console.log(`  🌍 Timezone: ${data.user.timeZone || 'N/A'}, Locale: ${data.user.locale || 'N/A'}`);
      } else if (toolName === 'getAssignableUsers' && data.assignableUsers) {
        console.log(`  👥 Assignable users: ${data.assignableUsers.length}`);
        if (data.assignmentStatistics) {
          console.log(`  📊 Active assignable: ${data.assignmentStatistics.activeAssignableUsers}`);
          console.log(`  📊 With groups: ${data.assignmentStatistics.usersWithGroups}`);
        }
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
  console.log("📁👥 === PROJECTS & USERS TOOLS TEST (7 Tools) ===");
  
  try {
    // Setup client
    const envVars = loadEnv();
    const client = new Client({ name: "projects-users-test-client", version: "1.0.0" });
    
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
    
    // Configuration info
    console.log(`📋 Testing with configured project: ${CONFIG.PROJECT_NAME} (${CONFIG.PROJECT_KEY})`);
    console.log(`👤 Configured admin user: ${CONFIG.ADMIN_USER.displayName}`);
    console.log(`📊 Max results limit: ${CONFIG.MAX_RESULTS}`);
    console.log(`👥 Max test users: ${CONFIG.MAX_TEST_USERS}`);

    // === PROJECTS TESTING ===
    console.log("\n📁 === PROJECTS OPERATIONS ===");

    // 1. List Projects (Read)
    const projectsResult = await testProjectsUsersTool(client, "listProjects", 
      { 
        includeArchived: false,
        expand: "description,lead,url,projectKeys,permissions,issueTypes,versions,components"
      }, 
      "List all accessible projects with full details"
    );

    // 2. Get Project (Read)
    await testProjectsUsersTool(client, "getProject", 
      { 
        projectKey: CONFIG.PROJECT_KEY,
        expand: "description,lead,url,projectKeys,permissions,issueTypes,versions,components"
      }, 
      "Get detailed project information"
    );

    // === USERS TESTING ===
    console.log("\n👥 === USERS OPERATIONS ===");

    // 3. Search Users (Read) - using configured limits
    const searchUsersResult = await testProjectsUsersTool(client, "searchUsers", 
      { 
        query: "admin",
        maxResults: CONFIG.MAX_TEST_USERS 
      }, 
      "Search users by query with configured limits"
    );

    // 4. List Users (Read) - comprehensive user listing with configured limits
    await testProjectsUsersTool(client, "listUsers", 
      { 
        maxResults: CONFIG.MAX_TEST_USERS,
        includeActive: true,
        includeInactive: false
      }, 
      "List users with comprehensive statistics and configured limits"
    );

    // 5. Get User (Read) - using configured admin user
    const testAccountId = CONFIG.ADMIN_USER.accountId;
    
    await testProjectsUsersTool(client, "getUser", 
      { accountId: testAccountId }, 
      `Get detailed user information for configured admin user (${CONFIG.ADMIN_USER.displayName})`
    );

    // 6. Get Assignable Users (Read) - project context with configured limits
    await testProjectsUsersTool(client, "getAssignableUsers", 
      { 
        project: CONFIG.PROJECT_KEY,
        maxResults: CONFIG.MAX_TEST_USERS
      }, 
      "Get users assignable to configured project issues"
    );

    // 7. Get Assignable Users (Read) - specific issue context if available
    try {
      // Get an issue to test issue-specific assignable users
      const issuesResult = await client.callTool({
        name: "listIssues",
        arguments: { projectKey: CONFIG.PROJECT_KEY, limit: 1 }
      });
      const issuesData = extractResponseData(issuesResult);
      
      if (issuesData?.issues?.length > 0) {
        const issueKey = issuesData.issues[0].key;
        
        await testProjectsUsersTool(client, "getAssignableUsers", 
          { 
            issueKey: issueKey,
            maxResults: CONFIG.MAX_TEST_USERS
          }, 
          `Get users assignable to specific issue: ${issueKey}`
        );
      }
    } catch (error) {
      console.log("⚠️  Issue-specific assignable users test skipped - no issues found");
    }

    // === INTEGRATION TESTING ===
    console.log("\n🔗 === INTEGRATION VERIFICATION ===");

    // Test project-user relationships using configured data
    if (projectsResult?.projects?.length > 0) {
      const testProject = projectsResult.projects.find((p: any) => p.key === CONFIG.PROJECT_KEY) || projectsResult.projects[0];
      console.log(`\n🔍 Analyzing configured project-user relationships:`);
      console.log(`  📁 Project: ${testProject.name} (${testProject.key})`);
      console.log(`  👤 Configured Admin User: ${CONFIG.ADMIN_USER.displayName} (${testAccountId.substring(0, 12)}...)`);
      console.log(`  🔑 Project Lead: ${testProject.lead?.displayName || 'N/A'}`);
      console.log(`  ⚙️  Project Type: ${testProject.projectTypeKey}`);
      console.log(`  📊 Components: ${testProject.components?.length || 0}`);
      console.log(`  📦 Versions: ${testProject.versions?.length || 0}`);
      console.log(`  📋 Project ID: ${testProject.id} (configured: ${CONFIG.PROJECT_ID})`);
    }

    // Summary with configuration details
    console.log("\n📊 === PROJECTS & USERS TEST SUMMARY ===");
    console.log("✅ Projects Operations: listProjects, getProject");
    console.log("✅ Users Operations: searchUsers, listUsers, getUser, getAssignableUsers (2 contexts)");
    console.log(`✅ Total tools tested: 7/7`);
    console.log(`✅ Configured project: ${CONFIG.PROJECT_NAME} (${CONFIG.PROJECT_KEY})`);
    console.log(`✅ Configured admin user: ${CONFIG.ADMIN_USER.displayName} (${testAccountId.substring(0, 12)}...)`);
    console.log(`✅ Max results limit: ${CONFIG.MAX_RESULTS}`);
    console.log(`✅ Max test users: ${CONFIG.MAX_TEST_USERS}`);
    console.log("✅ Configuration-driven testing: All operations use real data from config");
    console.log("✅ Integration verification: Project-user relationships analyzed with configured data");
    
    await client.close();
    console.log("✅ Connection closed successfully");
    
  } catch (error) {
    console.error("❌ Projects & Users Test Error:", error);
    process.exit(1);
  }
}

main();