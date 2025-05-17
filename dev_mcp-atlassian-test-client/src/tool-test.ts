import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function main() {
  try {
    console.log("=== MCP Atlassian Tool Test (Refactored) ===");
    const envVars = loadEnv();
    const client = new Client({ name: "mcp-atlassian-test-client", version: "1.0.0" });
    const serverPath = "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js";
    const processEnv: Record<string, string> = {};
    Object.keys(process.env).forEach(key => {
      if (process.env[key] !== undefined) {
        processEnv[key] = process.env[key] as string;
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
    await client.connect(transport);
    console.log("Connected to MCP server\n");

    // === Jira Tools ===
    console.log("--- Jira Tool Tests ---");
    const jiraProjectKey = "XDEMO2";
    // 1. createIssue
    const newIssueSummary = `Test Issue ${new Date().toLocaleString()}`;
    const createIssueResult = await client.callTool({
      name: "createIssue",
      arguments: {
        projectKey: jiraProjectKey,
        summary: newIssueSummary,
        description: "Test issue created by MCP tool-test",
        issueType: "Task"
      }
    });
    console.log("createIssueResult (raw):", createIssueResult);
    let createIssueObj = createIssueResult;
    if (
      createIssueObj.content &&
      Array.isArray(createIssueObj.content) &&
      typeof createIssueObj.content[0]?.text === 'string'
    ) {
      createIssueObj = JSON.parse(createIssueObj.content[0].text);
      console.log("createIssueResult (parsed):", createIssueObj);
    }
    console.log("createIssue:", createIssueObj.key ? "✅" : "❌", createIssueObj.key || "Unknown");
    const newIssueKey = createIssueObj.key;

    // 2. updateIssue
    if (newIssueKey) {
      const updateIssueResult = await client.callTool({
        name: "updateIssue",
        arguments: {
          issueIdOrKey: newIssueKey,
          summary: `${newIssueSummary} (Updated)`
        }
      });
      console.log("updateIssueResult (raw):", updateIssueResult);
      let updateIssueObj = updateIssueResult;
      if (
        updateIssueObj.content &&
        Array.isArray(updateIssueObj.content) &&
        typeof updateIssueObj.content[0]?.text === 'string'
      ) {
        updateIssueObj = JSON.parse(updateIssueObj.content[0].text);
        console.log("updateIssueResult (parsed):", updateIssueObj);
      }
      console.log("updateIssue:", updateIssueObj.success ? "✅" : "❌");
    }

    // 3. assignIssue
    if (newIssueKey) {
      const assignIssueResult = await client.callTool({
        name: "assignIssue",
        arguments: {
          issueIdOrKey: newIssueKey,
          accountId: ""
        }
      });
      console.log("assignIssueResult (raw):", assignIssueResult);
      let assignIssueObj = assignIssueResult;
      if (
        assignIssueObj.content &&
        Array.isArray(assignIssueObj.content) &&
        typeof assignIssueObj.content[0]?.text === 'string'
      ) {
        assignIssueObj = JSON.parse(assignIssueObj.content[0].text);
        console.log("assignIssueResult (parsed):", assignIssueObj);
      }
      console.log("assignIssue:", assignIssueObj.success ? "✅" : "❌");
    }

    // 4. transitionIssue
    if (newIssueKey) {
      const transitionIssueResult = await client.callTool({
        name: "transitionIssue",
        arguments: {
          issueIdOrKey: newIssueKey,
          transitionId: "11",
          comment: "Test transition"
        }
      });
      console.log("transitionIssueResult (raw):", transitionIssueResult);
      let transitionIssueObj = transitionIssueResult;
      if (
        transitionIssueObj.content &&
        Array.isArray(transitionIssueObj.content) &&
        typeof transitionIssueObj.content[0]?.text === 'string'
      ) {
        transitionIssueObj = JSON.parse(transitionIssueObj.content[0].text);
        console.log("transitionIssueResult (parsed):", transitionIssueObj);
      }
      console.log("transitionIssue:", transitionIssueObj.success ? "✅" : "❌");
    }

    // 5. createSprint (nếu có boardId)
    let boardId = null;
    try {
      const boardsResult = await client.readResource({ uri: `jira://boards` });
      if (boardsResult.contents && boardsResult.contents[0].text) {
        const boardsData = JSON.parse(String(boardsResult.contents[0].text));
        if (boardsData && boardsData.boards && boardsData.boards.length > 0) {
          for (const board of boardsData.boards) {
            if (board.type === "scrum") {
              boardId = board.id;
              break;
            }
          }
        }
      }
    } catch {}
    let newSprintId = null;
    if (boardId) {
      try {
        const createSprintResult = await client.callTool({
          name: "createSprint",
          arguments: {
            boardId: String(boardId),
            name: `Sprint-${Date.now()}`.substring(0, 25),
            goal: "Test sprint created by MCP tool-test"
          }
        });
        console.log("createSprintResult (raw):", createSprintResult);
        let createSprintObj = createSprintResult;
        if (
          createSprintObj.content &&
          Array.isArray(createSprintObj.content) &&
          typeof createSprintObj.content[0]?.text === 'string'
        ) {
          createSprintObj = JSON.parse(createSprintObj.content[0].text);
          console.log("createSprintResult (parsed):", createSprintObj);
        }
        console.log("createSprint:", createSprintObj.id ? "✅" : "❌", createSprintObj.id || "Unknown");
        newSprintId = createSprintObj.id;
      } catch (e) {
        console.log("createSprint: ❌", e instanceof Error ? e.message : String(e));
      }
    }

    // 6. createFilter
    const createFilterResult = await client.callTool({
      name: "createFilter",
      arguments: {
        name: `Test Filter ${Date.now()}`,
        jql: "project = XDEMO2 ORDER BY created DESC",
        description: "Test filter created by MCP tool-test",
        favourite: false
      }
    });
    console.log("createFilterResult (raw):", createFilterResult);
    let createFilterObj = createFilterResult;
    if (
      createFilterObj.content &&
      Array.isArray(createFilterObj.content) &&
      typeof createFilterObj.content[0]?.text === 'string'
    ) {
      createFilterObj = JSON.parse(createFilterObj.content[0].text);
      console.log("createFilterResult (parsed):", createFilterObj);
    }
    console.log("createFilter:", createFilterObj.id ? "✅" : "❌", createFilterObj.id || "Unknown");

    // 7. createDashboard
    const createDashboardResult = await client.callTool({
      name: "createDashboard",
      arguments: {
        name: `Dashboard-${Date.now()}`,
        description: "Test dashboard created by MCP tool-test"
      }
    });
    console.log("createDashboardResult (raw):", createDashboardResult);
    let createDashboardObj = createDashboardResult;
    if (
      createDashboardObj.content &&
      Array.isArray(createDashboardObj.content) &&
      typeof createDashboardObj.content[0]?.text === 'string'
    ) {
      createDashboardObj = JSON.parse(createDashboardObj.content[0].text);
      console.log("createDashboardResult (parsed):", createDashboardObj);
    }
    console.log("createDashboard:", createDashboardObj.id ? "✅" : "❌", createDashboardObj.id || "Unknown");

    // === Confluence Tools ===
    console.log("\n--- Confluence Tool Tests ---");
    // const confluenceSpaceKey = "AWA1";
    // let spaceId: string | null = null;
    // let parentId: string | null = null;
    // Lấy đúng spaceId (số) từ resource confluence://spaces/AWA1
    // try {
    //   const spaceResult = await client.readResource({ uri: `confluence://spaces/${confluenceSpaceKey}` });
    //   if (spaceResult.contents && spaceResult.contents[0].text) {
    //     const data = JSON.parse(String(spaceResult.contents[0].text));
    //     console.log("spaceResult data:", data);
    //     spaceId = data.id || data.spaceId || (data.space && data.space.id) || null;
    //     console.log(`Using spaceId for createPage: ${spaceId}`);
    //   }
    // } catch (e) {
    //   console.log("Error fetching spaceId:", e instanceof Error ? e.message : String(e));
    // }
    // Sử dụng trực tiếp spaceId số
    const confluenceSpaceId = "19464200";
    let spaceId: string | null = confluenceSpaceId;
    let parentId: string | null = null;
    // Lấy parentId là page đầu tiên trong resource confluence://spaces/19464200/pages
    try {
      const pagesResult = await client.readResource({ uri: `confluence://spaces/${confluenceSpaceId}/pages` });
      if (pagesResult.contents && pagesResult.contents[0].text) {
        const data = JSON.parse(String(pagesResult.contents[0].text));
        if (data.pages && data.pages.length > 0) {
          parentId = data.pages[0].id;
          console.log(`Using parentId for createPage: ${parentId}`);
        }
      }
    } catch (e) {
      console.log("Error fetching parentId:", e instanceof Error ? e.message : String(e));
    }
    const newPageTitle = `Test Page ${new Date().toLocaleString()}`;
    let newPageId: string | null = null;
    if (spaceId && parentId) {
      try {
          const createPageResult = await client.callTool({
            name: "createPage",
            arguments: {
            spaceId: spaceId,
            parentId: parentId,
              title: newPageTitle,
              content: "<p>This is a test page created by MCP tool-test</p>"
            }
          });
        console.log("createPageResult (raw):", createPageResult);
        let createPageObj = createPageResult;
        if (
          createPageObj.content &&
          Array.isArray(createPageObj.content) &&
          typeof createPageObj.content[0]?.text === 'string'
        ) {
          createPageObj = JSON.parse(createPageObj.content[0].text);
          console.log("createPageResult (parsed):", createPageObj);
        }
        console.log("createPage:", createPageObj.id ? "✅" : "❌", createPageObj.id || "Unknown");
        if (createPageObj && createPageObj.id) newPageId = String(createPageObj.id);
      } catch (e) {
        console.log("createPage: ❌", e instanceof Error ? e.message : String(e));
      }
    } else {
      console.log("Skip createPage: No spaceId or parentId available");
    }
    // 2. updatePage
    if (newPageId) {
      try {
        const updatePageResult = await client.callTool({
          name: "updatePage",
          arguments: {
            pageId: newPageId,
            title: `${newPageTitle} (Updated)`,
            content: "<p>This page has been updated by MCP tool-test</p>",
            version: 1
          }
        });
        console.log("updatePageResult (raw):", updatePageResult);
        let updatePageObj = updatePageResult;
        if (
          updatePageObj.content &&
          Array.isArray(updatePageObj.content) &&
          typeof updatePageObj.content[0]?.text === 'string'
        ) {
          updatePageObj = JSON.parse(updatePageObj.content[0].text);
          console.log("updatePageResult (parsed):", updatePageObj);
        }
        console.log("updatePage:", updatePageObj.success ? "✅" : "❌");
      } catch (e) {
        console.log("updatePage: ❌", e instanceof Error ? e.message : String(e));
      }
    }
    // 3. addComment
    if (newPageId) {
      try {
        const addCommentResult = await client.callTool({
          name: "addComment",
          arguments: {
            pageId: newPageId,
            content: "<p>This is a test comment added by MCP tool-test</p>"
          }
        });
        console.log("addCommentResult (raw):", addCommentResult);
        let addCommentObj = addCommentResult;
        if (
          addCommentObj.content &&
          Array.isArray(addCommentObj.content) &&
          typeof addCommentObj.content[0]?.text === 'string'
        ) {
          addCommentObj = JSON.parse(addCommentObj.content[0].text);
          console.log("addCommentResult (parsed):", addCommentObj);
        }
        console.log("addComment:", addCommentObj.id ? "✅" : "❌");
      } catch (e) {
        console.log("addComment: ❌", e instanceof Error ? e.message : String(e));
      }
    }
    // 4. updatePageTitle
    if (newPageId) {
      try {
        const updatePageTitleResult = await client.callTool({
          name: "updatePageTitle",
          arguments: {
            pageId: newPageId,
            title: `${newPageTitle} (Title Updated)`,
            version: 2
          }
        });
        console.log("updatePageTitleResult (raw):", updatePageTitleResult);
        let updatePageTitleObj = updatePageTitleResult;
        if (
          updatePageTitleObj.content &&
          Array.isArray(updatePageTitleObj.content) &&
          typeof updatePageTitleObj.content[0]?.text === 'string'
        ) {
          updatePageTitleObj = JSON.parse(updatePageTitleObj.content[0].text);
          console.log("updatePageTitleResult (parsed):", updatePageTitleObj);
        }
        console.log("updatePageTitle:", updatePageTitleObj.success ? "✅" : "❌");
      } catch (e) {
        console.log("updatePageTitle: ❌", e instanceof Error ? e.message : String(e));
      }
    }
    // 5. deletePage
    if (newPageId) {
      try {
        const deletePageResult = await client.callTool({
          name: "deletePage",
          arguments: {
            pageId: newPageId
          }
        });
        console.log("deletePageResult (raw):", deletePageResult);
        let deletePageObj = deletePageResult;
        if (
          deletePageObj.content &&
          Array.isArray(deletePageObj.content) &&
          typeof deletePageObj.content[0]?.text === 'string'
        ) {
          deletePageObj = JSON.parse(deletePageObj.content[0].text);
          console.log("deletePageResult (parsed):", deletePageObj);
        }
        console.log("deletePage:", deletePageObj.success ? "✅" : "❌");
      } catch (e) {
        console.log("deletePage: ❌", e instanceof Error ? e.message : String(e));
      }
    }

    // === Resource Test ===
    console.log("\n--- Resource Test ---");
    // Jira resource
    try {
      const issuesResult = await client.readResource({ uri: "jira://issues" });
      if (issuesResult.contents && issuesResult.contents[0].text) {
        const data = JSON.parse(String(issuesResult.contents[0].text));
        console.log("jira://issues response: total issues:", data.metadata?.total ?? data.issues?.length ?? "?");
      } else {
        console.log("No content returned for jira://issues");
      }
    } catch (e) {
      console.log("Error reading jira://issues:", e instanceof Error ? e.message : String(e));
    }
    // Confluence resource
    try {
      const pagesResult = await client.readResource({ uri: `confluence://spaces/${confluenceSpaceId}/pages` });
      if (pagesResult.contents && pagesResult.contents[0].text) {
        const data = JSON.parse(String(pagesResult.contents[0].text));
        console.log("confluence://spaces/19464200/pages response: total pages:", data.metadata?.total ?? data.pages?.length ?? "?");
    } else {
        console.log("No content returned for confluence://spaces/19464200/pages");
      }
    } catch (e) {
      console.log("Error reading confluence://spaces/19464200/pages:", e instanceof Error ? e.message : String(e));
    }

    // Summary
    console.log("\n=== Tool Test Summary ===");
    console.log("All important tools and resources have been tested!");
    await client.close();
    console.log("Connection closed successfully");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();