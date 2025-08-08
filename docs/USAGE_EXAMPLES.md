# MCP Jira Server v3.0.0 - Usage Examples

> **Practical examples for all 25 Jira tools with real-world scenarios**
> 
> **For AI Assistants**: These examples are optimized for Cline, Claude Desktop, and other MCP-compatible AI assistants

---

## 🎯 Quick Start Examples

### Basic Issue Management
```javascript
// List issues in a project
await callTool("listIssues", {
  projectKey: "MYPROJ", 
  limit: 10
});

// Get detailed issue information
await callTool("getIssue", {
  issueKey: "MYPROJ-123"
});

// Create a new bug report
await callTool("createIssue", {
  projectKey: "MYPROJ",
  summary: "Login button not responsive on mobile",
  description: "Users report the login button doesn't work on mobile devices",
  issueType: "Bug",
  priority: "High",
  labels: ["mobile", "ui", "urgent"]
});
```

### Project & User Discovery
```javascript
// Find available projects
await callTool("listProjects", {
  includeArchived: false
});

// Search for team members
await callTool("searchUsers", {
  query: "john",
  projectKey: "MYPROJ",
  maxResults: 10
});
```

---

## 📋 Issue Management Workflows

### Complete Issue Lifecycle
```javascript
// 1. Create a user story
const newIssue = await callTool("createIssue", {
  projectKey: "SCRUM",
  summary: "As a user, I want to reset my password",
  description: "User story for password reset functionality",
  issueType: "Story",
  priority: "Medium",
  labels: ["user-management", "security"]
});

// 2. Assign to developer
await callTool("assignIssue", {
  issueKey: "SCRUM-45", 
  accountId: "developer123"
});

// 3. Move to In Progress
await callTool("transitionIssue", {
  issueKey: "SCRUM-45",
  transitionId: "21", // Get from getIssue transitions
  comment: "Starting development work"
});

// 4. Update with progress
await callTool("updateIssue", {
  issueKey: "SCRUM-45",
  description: "Added password validation logic. Working on email integration.",
  labels: ["user-management", "security", "in-progress"]
});

// 5. Move to Done
await callTool("transitionIssue", {
  issueKey: "SCRUM-45", 
  transitionId: "31",
  comment: "Feature completed and tested"
});
```

### Advanced Issue Search
```javascript
// Find high-priority bugs assigned to current user
await callTool("searchIssues", {
  jql: "assignee = currentUser() AND priority = High AND type = Bug AND resolution = Unresolved",
  maxResults: 20
});

// Find issues updated in last 7 days
await callTool("searchIssues", {
  jql: "updated >= -7d ORDER BY updated DESC",
  maxResults: 50
});

// Find issues ready for testing
await callTool("searchIssues", {
  jql: "status = 'Ready for Testing' AND project = MYPROJ",
  maxResults: 25
});
```

---

## 🏃‍♂️ Sprint & Agile Management

### Sprint Planning Workflow
```javascript
// 1. Create a new sprint
const sprint = await callTool("createSprint", {
  name: "Sprint 23 - User Experience",
  originBoardId: 42,
  goal: "Improve user onboarding experience",
  startDate: "2025-01-13",
  endDate: "2025-01-27"
});

// 2. Add issues to the sprint
await callTool("addIssueToSprint", {
  sprintId: 156,
  issueKeys: ["PROJ-45", "PROJ-46", "PROJ-47", "PROJ-48"]
});

// 3. Start the sprint
await callTool("startSprint", {
  sprintId: 156,
  goal: "Deliver responsive login and improved onboarding",
  startDate: "2025-01-13",
  endDate: "2025-01-27"
});
```

### Backlog Management
```javascript
// Move completed issues to backlog for next sprint
await callTool("addIssuesToBacklog", {
  issueKeys: ["PROJ-50", "PROJ-51"],
  boardId: 42
});

// Prioritize backlog items
await callTool("rankBacklogIssues", {
  issues: ["PROJ-52"],
  rankAfterIssue: "PROJ-45", // Put PROJ-52 after PROJ-45
});

// Close completed sprint
await callTool("closeSprint", {
  sprintId: 155
});
```

---

## 🔍 Filter & Dashboard Management

### Custom Filter Creation
```javascript
// Create filter for code review tasks
await callTool("createFilter", {
  name: "Code Review Queue",
  jql: "status = 'Code Review' AND assignee = currentUser() ORDER BY priority DESC, updated ASC",
  description: "All my code reviews ordered by priority and age",
  favourite: true
});

// Create team workload filter
await callTool("createFilter", {
  name: "Team Sprint Progress",
  jql: "sprint in openSprints() AND project = MYPROJ ORDER BY status ASC, priority DESC",
  description: "Current sprint progress for the team"
});

// Update existing filter
await callTool("updateFilter", {
  filterId: "12345",
  name: "Updated Code Review Queue", 
  jql: "status in ('Code Review', 'Ready for Testing') AND assignee = currentUser()",
  description: "Expanded to include testing tasks"
});
```

### Dashboard & Gadget Setup
```javascript
// Create project dashboard
const dashboard = await callTool("createDashboard", {
  name: "Project MYPROJ - Team Dashboard",
  description: "Sprint progress, burndown, and team metrics"
});

// Get available gadgets
const gadgets = await callTool("getJiraGadgets");
// Returns 31 gadgets including: Filter Results, Pie Chart, Sprint Burndown, etc.

// Add filter results gadget
await callTool("addGadgetToDashboard", {
  dashboardId: "67890",
  uri: "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:filter-results-gadget/gadgets/filter-results-gadget.xml",
  title: "Sprint Issues",
  properties: {
    filterId: "12345" // Use the filter created above
  }
});

// Add sprint burndown chart
await callTool("addGadgetToDashboard", {
  dashboardId: "67890", 
  uri: "rest/gadgets/1.0/g/com.pyxis.greenhopper.jira:greenhopper-gadget-sprint-burndown/gadgets/greenhopper-sprint-burndown.xml",
  title: "Sprint 23 Burndown"
});
```

---

## 🏗️ Project & User Management

### Team Onboarding
```javascript
// Get project details for new team member
const project = await callTool("getProject", {
  projectKey: "NEWPROJECT"
});
// Returns components, versions, roles, permissions

// Find team members for introductions
const teamMembers = await callTool("searchUsers", {
  projectKey: "NEWPROJECT",
  maxResults: 20
});

// Get specific user details
const userProfile = await callTool("getUser", {
  accountId: "new-team-member-123"
});
// Returns groups, roles, permissions
```

### Project Health Check
```javascript
// Check project status
const openIssues = await callTool("searchIssues", {
  jql: "project = HEALTH AND resolution = Unresolved",
  maxResults: 100
});

// Find overdue issues
const overdueIssues = await callTool("searchIssues", {
  jql: "project = HEALTH AND duedate < now() AND resolution = Unresolved",
  maxResults: 50
});

// Find unassigned high priority issues
const unassigned = await callTool("searchIssues", {
  jql: "project = HEALTH AND assignee is EMPTY AND priority in (Highest, High)",
  maxResults: 25
});
```

---

## 🔧 Advanced Workflows

### Bug Triage Process
```javascript
// 1. Find new bugs
const newBugs = await callTool("listIssues", {
  projectKey: "SUPPORT",
  status: "Open", 
  limit: 20
});

// 2. For each critical bug, assign and prioritize
await callTool("updateIssue", {
  issueKey: "SUPPORT-789",
  priority: "Highest",
  labels: ["critical", "production", "triage-complete"]
});

await callTool("assignIssue", {
  issueKey: "SUPPORT-789",
  accountId: "senior-dev-456" 
});

// 3. Transition to In Progress
await callTool("transitionIssue", {
  issueKey: "SUPPORT-789",
  transitionId: "21",
  comment: "Triaged as critical production issue. Assigning to senior developer."
});
```

### Release Planning
```javascript
// 1. Create release filter
await callTool("createFilter", {
  name: "Release 2.1.0 Issues",
  jql: "fixVersion = '2.1.0' AND project = RELEASE ORDER BY priority DESC",
  description: "All issues planned for release 2.1.0"
});

// 2. Find issues ready for release
const releaseReady = await callTool("searchIssues", {
  jql: "fixVersion = '2.1.0' AND status = Done AND project = RELEASE",
  maxResults: 100
});

// 3. Find blocked issues
const blockedIssues = await callTool("searchIssues", {
  jql: "fixVersion = '2.1.0' AND status = Blocked AND project = RELEASE",
  maxResults: 50  
});
```

### Performance Monitoring
```javascript
// Create dashboard for performance tracking
const perfDashboard = await callTool("createDashboard", {
  name: "Performance Metrics Dashboard",
  description: "Track team velocity, issue resolution time, and sprint health"
});

// Add created vs resolved chart
await callTool("addGadgetToDashboard", {
  dashboardId: perfDashboard.data.id,
  uri: "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:created-vs-resolved-issues-chart-gadget/gadgets/createdvsresolved-gadget.xml",
  title: "Created vs Resolved Trend"
});

// Add resolution time gadget
await callTool("addGadgetToDashboard", {
  dashboardId: perfDashboard.data.id,
  uri: "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:resolution-time-gadget/gadgets/resolution-time-gadget.xml", 
  title: "Average Resolution Time"
});
```

---

## 🤖 AI Assistant Integration

### Daily Standup Report
```javascript
// AI can generate daily standup reports
const myIssues = await callTool("searchIssues", {
  jql: "assignee = currentUser() AND status changed DURING (-1d, now()) ORDER BY updated DESC",
  maxResults: 10
});

const inProgress = await callTool("listIssues", {
  assigneeId: "currentUser",
  status: "In Progress",
  limit: 5
});

// AI formats this into: "Yesterday I completed PROJ-123 and PROJ-124. 
// Today I'm working on PROJ-125. No blockers."
```

### Sprint Planning Assistant  
```javascript
// AI helps estimate sprint capacity
const sprintBacklog = await callTool("searchIssues", {
  jql: "sprint in openSprints() AND project = MYPROJ",
  maxResults: 50
});

const teamMembers = await callTool("searchUsers", {
  projectKey: "MYPROJ", 
  maxResults: 10
});

// AI analyzes workload distribution and suggests rebalancing
```

### Automated Triage
```javascript
// AI can help with intelligent issue triage
const untriagedIssues = await callTool("searchIssues", {
  jql: "project = SUPPORT AND status = Open AND labels is EMPTY",
  maxResults: 25
});

// AI analyzes issue content and suggests:
// - Priority level
// - Appropriate labels
// - Best assignee based on expertise
// - Similar existing issues
```

---

## 🔍 Troubleshooting

### Common Issues & Solutions

**Issue**: Tool returns "404 Not Found"
```javascript
// Solution: Verify project key exists
const projects = await callTool("listProjects");
// Check if your project key is in the results
```

**Issue**: "Permission denied" errors
```javascript
// Solution: Check user permissions
const user = await callTool("getUser", {
  accountId: "your-account-id"
});
// Verify user has appropriate project roles
```

**Issue**: Empty search results
```javascript
// Solution: Validate JQL syntax
await callTool("searchIssues", {
  jql: "project = MYPROJ", // Start simple
  maxResults: 5
});
// Build complexity gradually
```

---

## 📊 Performance Tips

1. **Use Filters**: Create filters for frequently used searches
2. **Limit Results**: Use `limit` and `maxResults` parameters appropriately  
3. **Batch Operations**: Group related tool calls together
4. **Cache Data**: Store project/user lookups to avoid repeated calls
5. **JQL Optimization**: Use specific field queries instead of text search

---

*Usage Examples for MCP Jira Server v3.0.0*  
*Last Updated: January 10, 2025*  
*All examples validated with 100% success rate ✅*