# MCP Atlassian Server: Resources & Tools Reference

This document provides detailed information about all available Resources and Tools in MCP Atlassian Server.

- **Resources**: Read-only data endpoints that provide information from Atlassian
- **Tools**: Action endpoints that can create, update, or modify data in Atlassian

## Resources

Resources are read-only endpoints that return data from Atlassian. They follow a URI pattern like `jira://resource-name` or `confluence://resource-name`.

### Jira Resources

#### 1. Issues

- **URI**: `jira://issues`
- **Description**: Get a list of issues, filtered by JQL (Jira Query Language)
- **Parameters**:
  - `jql`: (Optional) JQL query to filter issues
  - `maxResults`: (Optional) Limit number of results
- **Example Usage**:
  ```
  jira://issues?jql=assignee=currentUser()
  jira://issues?jql=project=DEMO
  ```
- **Notes**: 
  - Simple JQL works best: `project=DEMO` instead of `project = DEMO AND key = DEMO-43`
  - Complex queries may need URL encoding

#### 2. Issue Details

- **URI**: `jira://issues/{issueKey}`
- **Description**: Get detailed information about a specific issue
- **Parameters**:
  - `issueKey`: Required issue key (e.g., DEMO-123)
- **Example Usage**:
  ```
  jira://issues/DEMO-123
  ```
- **Notes**: Includes issue fields, status, assignee, reporter, and more

#### 3. Issue Transitions

- **URI**: `jira://issues/{issueKey}/transitions`
- **Description**: Get available transitions for a specific issue
- **Parameters**:
  - `issueKey`: Required issue key
- **Example Usage**:
  ```
  jira://issues/DEMO-123/transitions
  ```
- **Notes**: Lists all possible workflow transitions for the issue

#### 4. Issue Comments

- **URI**: `jira://issues/{issueKey}/comments`
- **Description**: Get comments for a specific issue
- **Parameters**:
  - `issueKey`: Required issue key
- **Example Usage**:
  ```
  jira://issues/DEMO-123/comments
  ```

#### 5. Projects

- **URI**: `jira://projects`
- **Description**: Get a list of all accessible projects
- **Parameters**: None
- **Example Usage**:
  ```
  jira://projects
  ```

#### 6. Project Details

- **URI**: `jira://projects/{projectKey}`
- **Description**: Get detailed information about a specific project
- **Parameters**:
  - `projectKey`: Required project key (e.g., DEMO)
- **Example Usage**:
  ```
  jira://projects/DEMO
  ```

#### 7. Project Roles

- **URI**: `jira://projects/{projectKey}/roles`
- **Description**: Get role information for a specific project
- **Parameters**:
  - `projectKey`: Required project key
- **Example Usage**:
  ```
  jira://projects/DEMO/roles
  ```

#### 8. Users

- **URI**: `jira://users`
- **Description**: Get a list of users
- **Parameters**: None
- **Example Usage**:
  ```
  jira://users
  ```

#### 9. User Details

- **URI**: `jira://users/{accountId}`
- **Description**: Get detailed information about a specific user
- **Parameters**:
  - `accountId`: Required Atlassian account ID
- **Example Usage**:
  ```
  jira://users/5b10a2844c20165700ede21g
  ```

#### 10. Assignable Users

- **URI**: `jira://users/assignable`
- **Description**: Get users who can be assigned to issues
- **Parameters**:
  - `project`: Optional project key to filter users
- **Example Usage**:
  ```
  jira://users/assignable?project=DEMO
  ```

### Confluence Resources

#### 1. Spaces

- **URI**: `confluence://spaces`
- **Description**: Get a list of all accessible Confluence spaces
- **Parameters**: None
- **Example Usage**:
  ```
  confluence://spaces
  ```

#### 2. Space Details

- **URI**: `confluence://spaces/{spaceKey}`
- **Description**: Get detailed information about a specific space
- **Parameters**:
  - `spaceKey`: Required space key (e.g., TEAM)
- **Example Usage**:
  ```
  confluence://spaces/TEAM
  ```

#### 3. Pages in Space

- **URI**: `confluence://spaces/{spaceKey}/pages`
- **Description**: Get all pages in a specific space
- **Parameters**:
  - `spaceKey`: Required space key
- **Example Usage**:
  ```
  confluence://spaces/TEAM/pages
  ```

#### 4. Page Details

- **URI**: `confluence://pages/{pageId}`
- **Description**: Get detailed information about a specific page
- **Parameters**:
  - `pageId`: Required page ID
- **Example Usage**:
  ```
  confluence://pages/123456
  ```

#### 5. Child Pages

- **URI**: `confluence://pages/{pageId}/children`
- **Description**: Get child pages of a specific page
- **Parameters**:
  - `pageId`: Required page ID
- **Example Usage**:
  ```
  confluence://pages/123456/children
  ```

#### 6. Page Comments

- **URI**: `confluence://pages/{pageId}/comments`
- **Description**: Get comments on a specific page
- **Parameters**:
  - `pageId`: Required page ID
- **Example Usage**:
  ```
  confluence://pages/123456/comments
  ```

#### 7. Content Search

- **URI**: `confluence://search`
- **Description**: Search Confluence content using CQL (Confluence Query Language)
- **Parameters**:
  - `cql`: Required CQL query
- **Example Usage**:
  ```
  confluence://search?cql=type=page AND space=TEAM
  ```

## Tools

Tools are action endpoints that can create, update, or modify data in Atlassian. They are called with specific parameters to perform actions.

### Jira Tools

#### 1. Create Issue

- **Name**: `createIssue`
- **Description**: Create a new Jira issue
- **Required Parameters**:
  - `projectKey`: The project key (e.g., DEMO)
  - `summary`: Issue summary/title
- **Optional Parameters**:
  - `description`: Detailed description
  - `issueType`: Issue type (defaults to "Task")
  - `assignee`: Account ID of assignee
  - `labels`: Array of labels
  - `priority`: Priority value
- **Example Usage**:
  ```json
  {
    "projectKey": "DEMO",
    "summary": "Fix login page error",
    "description": "Users cannot log in from mobile devices",
    "issueType": "Bug"
  }
  ```
- **Notes**: 
  - For best results, provide only the minimum required fields
  - Markdown is supported in the description field

#### 2. Update Issue

- **Name**: `updateIssue`
- **Description**: Update an existing Jira issue
- **Required Parameters**:
  - `issueKey`: The issue key (e.g., DEMO-123)
- **Optional Parameters**:
  - `summary`: Updated summary
  - `description`: Updated description
  - `assignee`: Account ID to reassign
  - `labels`: Array of labels
- **Example Usage**:
  ```json
  {
    "issueKey": "DEMO-123",
    "summary": "Updated: Fix login page error",
    "assignee": "5b10a2844c20165700ede21g"
  }
  ```

#### 3. Transition Issue

- **Name**: `transitionIssue`
- **Description**: Move an issue to a different status
- **Required Parameters**:
  - `issueKey`: The issue key (e.g., DEMO-123)
  - `transitionId`: ID of the transition to perform
- **Example Usage**:
  ```json
  {
    "issueKey": "DEMO-123",
    "transitionId": "21"
  }
  ```
- **Notes**: 
  - Use the issue transitions resource first to find available transition IDs
  - Common transitions: "In Progress", "Done", "To Do"

#### 4. Assign Issue

- **Name**: `assignIssue`
- **Description**: Assign an issue to a user
- **Required Parameters**:
  - `issueKey`: The issue key (e.g., DEMO-123)
  - `accountId`: Account ID of the assignee
- **Example Usage**:
  ```json
  {
    "issueKey": "DEMO-123",
    "accountId": "5b10a2844c20165700ede21g"
  }
  ```
- **Notes**: Use empty accountId to unassign

### Confluence Tools

#### 1. Create Page

- **Name**: `createPage`
- **Description**: Create a new Confluence page
- **Required Parameters**:
  - `spaceKey`: The space key (e.g., TEAM)
  - `title`: Page title
  - `content`: Page content in HTML format
- **Optional Parameters**:
  - `parentId`: ID of parent page
- **Example Usage**:
  ```json
  {
    "spaceKey": "TEAM",
    "title": "Meeting Notes",
    "content": "<p>Discussion points:</p><ul><li>Project timeline</li><li>Resource allocation</li></ul>"
  }
  ```
- **Notes**: 
  - Use simple HTML content for best results
  - Avoid specifying parentId for initial testing

#### 2. Update Page

- **Name**: `updatePage` (hoặc `editPage`)
- **Description**: Cập nhật nội dung, tiêu đề, version, và labels cho một trang Confluence đã có
- **Required Parameters**:
  - `pageId`: ID của trang cần cập nhật
  - `title`: Tiêu đề mới của trang (bắt buộc, do API Atlassian yêu cầu)
  - `content`: Nội dung mới của trang (HTML hoặc storage format)
  - `version`: Số version hiện tại của trang (bắt buộc, để tránh conflict)
- **Optional Parameters**:
  - `labels`: Danh sách label mới (thay thế toàn bộ labels hiện tại)
- **Example Usage**:
  ```json
  {
    "pageId": "123456",
    "title": "Updated Meeting Notes",
    "content": "<p>Updated discussion points...</p>",
    "version": 3,
    "labels": ["meeting", "2024"]
  }
  ```
- **Notes**:
  - Luôn lấy version hiện tại của trang trước khi cập nhật (dùng resource `confluence://pages/{pageId}`)
  - Nếu không truyền đúng version, API sẽ báo lỗi conflict
  - Trường labels là tuỳ chọn, nếu không truyền sẽ giữ nguyên labels cũ
  - Nội dung nên dùng HTML hoặc storage format chuẩn của Confluence (có thể lấy từ resource page mẫu)
  - Khi cập nhật labels, toàn bộ labels cũ sẽ bị thay thế
  - Nếu chỉ muốn cập nhật một trường (ví dụ chỉ đổi title), vẫn phải truyền đủ các trường bắt buộc (title, content, version)

#### 3. Add Comment

- **Name**: `addComment`
- **Description**: Add a comment to a Confluence page
- **Required Parameters**:
  - `pageId`: The page ID
  - `content`: Comment content in HTML format
- **Example Usage**:
  ```json
  {
    "pageId": "123456",
    "content": "<p>This documentation is very helpful!</p>"
  }
  ```

## Best Practices

1. **Start Simple**: Begin with basic queries and parameters
2. **Check Permissions**: Ensure the Atlassian account has access to the projects/spaces
3. **Handle Errors**: Always check for error responses
4. **Chain Resources and Tools**: Use resources to get information before performing actions with tools
5. **Use Clear Examples**: When instructing AI assistants, provide clear examples of what you want

## Common Workflows

### Project Management

1. Get project list: `jira://projects`
2. View issues in project: `jira://issues?jql=project=DEMO`
3. Create new issue: Use `createIssue` tool
4. Update status: Use `transitionIssue` tool

### Documentation

1. Get space list: `confluence://spaces`
2. View pages in space: `confluence://spaces/TEAM/pages`
3. Create new page: Use `createPage` tool
4. Add comments: Use `addComment` tool

## What's Coming Next

Future enhancements will include:
- Jira: Filters, Boards, Dashboards, Sprints, Backlog Management
- Confluence: Labels, Attachments, Content Versions History
- Advanced features: Prompts, Sampling, Smart caching, personalization 