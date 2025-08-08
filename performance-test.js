import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs";

// Load environment variables from .env
function loadEnv() {
  try {
    const envFile = '.env';
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envVars = {};
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

async function performanceTest() {
  const envVars = loadEnv();
  const client = new Client({ name: "performance-test-client", version: "1.0.0" });
  const serverPath = "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js";
  
  const processEnv = {};
  Object.keys(process.env).forEach(key => {
    if (process.env[key] !== undefined) {
      processEnv[key] = process.env[key];
    }
  });

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: {
      ...processEnv,
      ...envVars
    }
  });

  const performanceResults = [];

  try {
    await client.connect(transport);
    console.log("=== MCP Jira Server Performance Test ===\n");

    // Test key tools for performance - focus on read operations that should be fast
    const testCases = [
      { name: "listProjects", args: { includeArchived: false } },
      { name: "listIssues", args: { projectKey: "XDEMO2", limit: 10 } },
      { name: "getProject", args: { projectKey: "XDEMO2" } },
      { name: "searchUsers", args: { query: "", maxResults: 5 } },
      { name: "searchIssues", args: { jql: "project = XDEMO2 ORDER BY created DESC", maxResults: 5 } },
      { name: "getJiraGadgets", args: {} }
    ];

    for (const testCase of testCases) {
      console.log(`Testing ${testCase.name}...`);
      
      // Run test 3 times and take average
      const times = [];
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now();
        
        try {
          await client.callTool({
            name: testCase.name,
            arguments: testCase.args
          });
          
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          times.push(responseTime);
          
        } catch (error) {
          console.log(`  Run ${i + 1}: ❌ Error - ${error.message}`);
          times.push(999999); // Mark as failed
        }
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      const status = avgTime < 500 ? "✅ PASS" : "❌ FAIL";
      const statusIcon = avgTime < 500 ? "✅" : "⚠️";
      
      console.log(`  ${status} - Avg: ${avgTime.toFixed(0)}ms, Min: ${minTime.toFixed(0)}ms, Max: ${maxTime.toFixed(0)}ms`);
      
      performanceResults.push({
        tool: testCase.name,
        avgTime: avgTime,
        minTime: minTime,
        maxTime: maxTime,
        passed: avgTime < 500
      });
    }

    console.log("\n=== Performance Summary ===");
    console.log("Target: <500ms average response time\n");
    
    let passCount = 0;
    let totalTools = performanceResults.length;
    
    performanceResults.forEach(result => {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${result.tool.padEnd(20)} ${status} ${result.avgTime.toFixed(0).padStart(4)}ms avg`);
      if (result.passed) passCount++;
    });
    
    console.log(`\nPerformance Results: ${passCount}/${totalTools} tools meet <500ms target`);
    
    if (passCount === totalTools) {
      console.log("🎉 ALL TOOLS MEET PERFORMANCE REQUIREMENTS");
    } else {
      console.log(`⚠️ ${totalTools - passCount} tools need performance optimization`);
    }

    await client.close();
    console.log("\n✅ Performance test completed");

  } catch (error) {
    console.error("❌ Performance test failed:", error);
  }
}

performanceTest();