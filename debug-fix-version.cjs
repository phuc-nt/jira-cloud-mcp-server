#!/usr/bin/env node

// Debug Fix Version assignment issue
const { execSync } = require('child_process');

async function testFixVersionAssignment() {
  console.log('🔧 Debug Fix Version Assignment Issue');
  console.log('=====================================');
  
  // Test case 1: Update issue with fixVersions (replace all)
  console.log('\n1️⃣ Testing fixVersions (replace all):');
  try {
    const result1 = execSync(`echo '{"issueIdOrKey": "XDEMO2-131", "fixVersions": ["v2.1.0", "v3.0.0"]}' | npx @modelcontextprotocol/inspector --transport stdin mcp-atlassian-server updateIssue`, {
      encoding: 'utf8',
      timeout: 10000
    });
    console.log('✅ Result:', result1);
  } catch (error) {
    console.log('❌ Error:', error.stderr || error.message);
  }
  
  // Test case 2: Add fix versions
  console.log('\n2️⃣ Testing addFixVersions:');
  try {
    const result2 = execSync(`echo '{"issueIdOrKey": "XDEMO2-131", "addFixVersions": ["v2.1.0"]}' | npx @modelcontextprotocol/inspector --transport stdin mcp-atlassian-server updateIssue`, {
      encoding: 'utf8',
      timeout: 10000
    });
    console.log('✅ Result:', result2);
  } catch (error) {
    console.log('❌ Error:', error.stderr || error.message);
  }
  
  // Test case 3: Get issue to verify
  console.log('\n3️⃣ Verify issue state:');
  try {
    const result3 = execSync(`echo '{"issueIdOrKey": "XDEMO2-131"}' | npx @modelcontextprotocol/inspector --transport stdin mcp-atlassian-server getIssue`, {
      encoding: 'utf8',
      timeout: 10000
    });
    console.log('✅ Issue state:', result3);
  } catch (error) {
    console.log('❌ Error:', error.stderr || error.message);
  }
  
  // Test case 4: Search by Fix Version
  console.log('\n4️⃣ Search issues by Fix Version:');
  try {
    const result4 = execSync(`echo '{"jql": "project = XDEMO2 AND fixVersion = \\"v2.1.0\\"", "maxResults": 5}' | npx @modelcontextprotocol/inspector --transport stdin mcp-atlassian-server searchIssues`, {
      encoding: 'utf8',
      timeout: 10000
    });
    console.log('✅ Search result:', result4);
  } catch (error) {
    console.log('❌ Error:', error.stderr || error.message);
  }
}

testFixVersionAssignment().catch(console.error);
