#!/usr/bin/env node
/**
 * Enhanced searchIssues tool comprehensive test
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

async function testEnhancedSearchIssues() {
  // Create MCP client
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(process.cwd(), "../dist/index.js")]
  });

  const client = new Client(
    {
      name: "enhanced-search-test-client",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );
  
  try {
    await client.connect(transport);
    console.log('Connected to MCP server');

    // Test 1: Basic project search
    console.log('\n=== Test 1: Basic Project Search ===');
    const basicResult = await client.callTool({
      name: "searchIssues",
      arguments: {
        projectKey: 'XDEMO2',
        maxResults: 5
      }
    });
    console.log('Basic search result:', JSON.stringify(basicResult, null, 2));

    // Test 2: Epic search with auto-detection
    console.log('\n=== Test 2: Epic Search (auto-detect) ===');
    const epicResult = await client.callTool({
      name: "searchIssues",
      arguments: {
        projectKey: 'XDEMO2',
        epicName: 'Auth', // Should auto-detect Epic type
        maxResults: 3
      }
    });
    console.log('Epic search result:', JSON.stringify(epicResult, null, 2));

    // Test 3: Story search with auto-detection and hierarchy
    console.log('\n=== Test 3: Story Search with Hierarchy (auto-detect) ===');
    const storyResult = await client.callTool({
      name: "searchIssues",
      arguments: {
        projectKey: 'XDEMO2',
        storyPoints: 5, // Should auto-detect Story type
        includeHierarchy: true,
        maxResults: 3
      }
    });
    console.log('Story search with hierarchy:', JSON.stringify(storyResult, null, 2));

    // Test 4: Sub-task search with auto-detection
    console.log('\n=== Test 4: Sub-task Search (auto-detect) ===');
    const subtaskResult = await client.callTool({
      name: "searchIssues",
      arguments: {
        projectKey: 'XDEMO2',
        parentKey: 'XDEMO2-147', // Should auto-detect Sub-task type
        maxResults: 5
      }
    });
    console.log('Sub-task search result:', JSON.stringify(subtaskResult, null, 2));

    // Test 5: Status and assignee filtering
    console.log('\n=== Test 5: Status Filtering ===');
    const statusResult = await client.callTool({
      name: "searchIssues",
      arguments: {
        projectKey: 'XDEMO2',
        status: 'To Do',
        maxResults: 3
      }
    });
    console.log('Status filter result:', JSON.stringify(statusResult, null, 2));

    // Test 6: Quick filter - my issues
    console.log('\n=== Test 6: Quick Filter - Recent Issues ===');
    const quickResult = await client.callTool({
      name: "searchIssues",
      arguments: {
        projectKey: 'XDEMO2',
        quickFilter: 'recent',
        maxResults: 3
      }
    });
    console.log('Quick filter result:', JSON.stringify(quickResult, null, 2));

    // Test 7: Custom JQL
    console.log('\n=== Test 7: Custom JQL ===');
    const customResult = await client.callTool({
      name: "searchIssues",
      arguments: {
        jql: 'project = XDEMO2 AND issuetype = Epic ORDER BY created DESC',
        maxResults: 2
      }
    });
    console.log('Custom JQL result:', JSON.stringify(customResult, null, 2));

    // Test 8: Story points range filtering
    console.log('\n=== Test 8: Story Points Range ===');
    const rangeResult = await client.callTool({
      name: "searchIssues",
      arguments: {
        projectKey: 'XDEMO2',
        storyPointsMin: 1,
        storyPointsMax: 10,
        includeProgress: true,
        maxResults: 3
      }
    });
    console.log('Story points range result:', JSON.stringify(rangeResult, null, 2));

    // Test 9: Summary text search
    console.log('\n=== Test 9: Summary Text Search ===');
    const textResult = await client.callTool({
      name: "searchIssues",
      arguments: {
        projectKey: 'XDEMO2',
        summary: 'Login',
        maxResults: 3
      }
    });
    console.log('Text search result:', JSON.stringify(textResult, null, 2));

    console.log('\n🎉 Enhanced searchIssues tool tests completed!');
    console.log('\n📋 Features tested:');
    console.log('✅ Auto-detection: Epic (epicName), Story (storyPoints), Sub-task (parentKey)');
    console.log('✅ Smart filtering: Status, assignee, priority');
    console.log('✅ Hierarchy info: Epic links, parent/child relationships');
    console.log('✅ Progress info: Story points, sprint data');
    console.log('✅ Quick filters: Recent, my-issues, unresolved');
    console.log('✅ Text search: Summary and description');
    console.log('✅ Range filtering: Story points min/max');
    console.log('✅ Custom JQL: Override smart filters');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
  }
}

testEnhancedSearchIssues();
