import { getTestConfig } from './config-manager.js';

const config = getTestConfig();

async function testFixVersionAssignment() {
  console.log('🔧 Debug Fix Version Assignment Issue');
  console.log('=====================================');
  
  // Test case 1: Update issue with fixVersions (replace all)
  console.log('\n1️⃣ Testing fixVersions (replace all):');
  try {
    const result1 = await config.callTool('updateIssue', {
      issueIdOrKey: 'XDEMO2-131',
      fixVersions: ['v2.1.0', 'v3.0.0']
    });
    console.log('✅ Result:', JSON.stringify(result1, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test case 2: Add fix versions
  console.log('\n2️⃣ Testing addFixVersions:');
  try {
    const result2 = await config.callTool('updateIssue', {
      issueIdOrKey: 'XDEMO2-131',
      addFixVersions: ['Sprint 24 Release']
    });
    console.log('✅ Result:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test case 3: Get issue to verify
  console.log('\n3️⃣ Verify issue state:');
  try {
    const result3 = await config.callTool('getIssue', {
      issueIdOrKey: 'XDEMO2-131'
    });
    console.log('✅ Issue fixVersions:', result3.fields?.fixVersions || 'No fixVersions');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test case 4: Search by Fix Version
  console.log('\n4️⃣ Search issues by Fix Version:');
  try {
    const result4 = await config.callTool('searchIssues', {
      jql: 'project = XDEMO2 AND fixVersion = "v2.1.0"',
      maxResults: 5
    });
    console.log('✅ Search result:', JSON.stringify(result4, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test case 5: Direct raw API call to see exact error
  console.log('\n5️⃣ Direct API test:');
  try {
    const apiResult = await config.callTool('updateIssue', {
      issueIdOrKey: 'XDEMO2-131',
      summary: 'Bug fix for authentication (updated)',
      fixVersions: ['v2.1.0']
    });
    console.log('✅ API Result:', JSON.stringify(apiResult, null, 2));
  } catch (error) {
    console.log('❌ API Error:', error.message);
  }
}

testFixVersionAssignment()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
