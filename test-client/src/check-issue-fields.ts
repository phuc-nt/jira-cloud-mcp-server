import { getTestConfig } from './config-manager.js';

const config = getTestConfig();

async function checkIssueFields() {
  console.log('🔍 Kiểm tra Issue Fields Configuration');
  console.log('=====================================');
  
  try {
    console.log('\n1️⃣ Kiểm tra trạng thái hiện tại của issue XDEMO2-131:');
    const currentIssue = await config.testTool('getIssue', {
      issueIdOrKey: 'XDEMO2-131'
    });
    
    if (currentIssue.success) {
      console.log('✅ Issue hiện tại:');
      console.log('  - Key:', currentIssue.issue.key);
      console.log('  - Summary:', currentIssue.issue.fields.summary);
      console.log('  - Fix Versions:', currentIssue.issue.fields.fixVersions || 'None');
      console.log('  - Project:', currentIssue.issue.fields.project.key);
    }
    
    console.log('\n2️⃣ Kiểm tra issue edit metadata:');
    const editMeta = await config.testTool('getIssueEditMeta', {
      issueIdOrKey: 'XDEMO2-131'
    });
    
    if (editMeta.success) {
      console.log('✅ Available fields for editing:');
      Object.keys(editMeta.fields).forEach(fieldKey => {
        const field = editMeta.fields[fieldKey];
        console.log(`  - ${fieldKey}: ${field.name} (${field.schema?.type || 'unknown type'})`);
        if (fieldKey === 'fixVersions') {
          console.log('    🎯 Found fixVersions field!');
        }
      });
    }
    
    console.log('\n3️⃣ Thử update với field khác để test API:');
    const testUpdate = await config.testTool('updateIssue', {
      issueIdOrKey: 'XDEMO2-131',
      summary: 'Bug fix for authentication - Updated at ' + new Date().toISOString()
    });
    
    if (testUpdate.success) {
      console.log('✅ Basic update works - API connection OK');
    } else {
      console.log('❌ Basic update failed:', testUpdate);
    }
    
    console.log('\n4️⃣ Kiểm tra project configuration:');
    const projectInfo = await config.testTool('getProject', {
      projectKey: 'XDEMO2',
      expand: 'issueTypes'
    });
    
    if (projectInfo.success) {
      console.log('✅ Project type:', projectInfo.project.projectTypeKey);
      console.log('✅ Project style:', projectInfo.project.style);
      console.log('✅ Available issue types:');
      projectInfo.project.issueTypes.forEach(type => {
        console.log(`  - ${type.name} (${type.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n📋 Summary và Recommendations:');
  console.log('1. Kiểm tra Jira project configuration');
  console.log('2. Verify Fix Version field is available on issue screens');
  console.log('3. Consider using different update approach');
}

checkIssueFields()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
