# MCP Atlassian Server (by phuc-nt) - Bundle Installation Guide for AI

> **Important Note:** This is a pre-built bundle version of MCP Atlassian Server. No compilation or dependency installation required - just extract and run!

## System Requirements
- macOS 10.15+ or Windows 10+
- Node.js v16+ (only for running the server, not for building)
- Atlassian Cloud account and API token
- Cline AI assistant (main supported client)

## Step 1: Extract the Bundle
```bash
# Extract the downloaded bundle
unzip mcp-atlassian-server-bundle.zip

# Navigate to the extracted directory
cd mcp-atlassian-server-bundle
```

## Step 2: Configure Cline

MCP Atlassian Server is specifically designed for seamless integration with Cline. Below is the guide to configure Cline to connect to the server:

### Determine the Full Path

First, determine the full path to your extracted bundle directory:

```bash
# macOS/Linux
pwd

# Windows (PowerShell)
(Get-Location).Path

# Windows (Command Prompt)
cd
```

Then, add the following configuration to your `cline_mcp_settings.json` file:

```json
{
  "mcpServers": {
    "phuc-nt/mcp-atlassian-server": {
      "disabled": false,
      "timeout": 60,
      "command": "node",
      "args": [
        "/full/path/to/mcp-atlassian-server-bundle/dist/index.js"
      ],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      },
      "transportType": "stdio"
    }
  }
}
```

Replace:
- `/full/path/to/` with the path you just obtained
- `your-site.atlassian.net` with your Atlassian site name
- `your-email@example.com` with your Atlassian email
- `your-api-token` with your Atlassian API token

> **Note for Windows**: The path on Windows may look like `C:\\Users\\YourName\\mcp-atlassian-server-bundle\\dist\\index.js` (use `\\` instead of `/`).

## Step 3: Get Atlassian API Token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token", name it (e.g., "MCP Server")
3. Copy the token immediately (it will not be shown again)

### Note on API Token Permissions

- **The API token inherits all permissions of the account that created it** – there is no separate permission mechanism for the token itself.
- **To use all features of MCP Server**, the account creating the token must have appropriate permissions:
  - **Jira**: Needs Browse Projects, Edit Issues, Assign Issues, Transition Issues, Create Issues, etc.
  - **Confluence**: Needs View Spaces, Add Pages, Add Comments, Edit Pages, etc.
- **If the token is read-only**, you can only use read resources (view issues, projects) but cannot create/update.
- **Recommendations**:
  - For personal use: You can use your main account's token
  - For team/long-term use: Create a dedicated service account with appropriate permissions
  - Do not share your token; if you suspect it is compromised, revoke and create a new one
- **If you get a "permission denied" error**, check the permissions of the account that created the token on the relevant projects/spaces

> **Summary**: MCP Atlassian Server works best when using an API token from an account with all the permissions needed for the actions you want the AI to perform on Jira/Confluence.

### Security Warning When Using LLMs

- **Security risk**: If you or the AI in Cline ask an LLM to read/analyze the `cline_mcp_settings.json` file, **your Atlassian token will be sent to a third-party server** (OpenAI, Anthropic, etc.).
- **How it works**:
  - Cline does **NOT** automatically send config files to the cloud
  - However, if you ask to "check the config file" or similar, the file content (including API token) will be sent to the LLM endpoint for processing
- **Safety recommendations**:
  - Do not ask the LLM to read/check config files containing tokens
  - If you need support, remove sensitive information before sending to the LLM
  - Treat your API token like a password – never share it in LLM prompts

> **Important**: If you do not ask the LLM to read the config file, your API token will only be used locally and will not be sent anywhere.

## Step 4: Run the Server (Optional Testing)

You can test the server locally before configuring Cline by running:

```bash
node dist/index.js
```

You should see output confirming the server is running. Press Ctrl+C to stop.

> **Note**: You don't need to manually run the server when using with Cline - Cline will automatically start and manage the server process.

## Verify Installation
After configuration, test the connection by asking Cline a question related to Jira or Confluence, for example:
- "List all projects in Jira"
- "Search for Confluence pages about [topic]"

Cline is optimized to work with this MCP Atlassian Server (by phuc-nt) and will automatically use the most appropriate resources and tools for your queries.

## Introduction & Usage Scenarios

### Capabilities of MCP Atlassian Server (by phuc-nt)

This MCP Server connects AI to Atlassian systems (Jira and Confluence), enabling:

#### Jira Information Access
- View details of issues, projects, and users
- Search issues with simple JQL
- View possible transitions
- View issue comments
- Find users assignable to tasks or by role

#### Jira Actions
- Create new issues
- Update issue content
- Transition issue status
- Assign issues to users

#### Confluence Information Access
- View spaces
- View pages and child pages
- View page details (title, content, version, labels)
- View comments on pages
- View labels on pages

#### Confluence Actions
- Create new pages with simple HTML content
- Update existing pages (title, content, version, labels)
- Add and remove labels on pages
- Add comments to pages

### Example Usage Scenarios

1. **Create and Manage Tasks**
   ```
   "Create a new issue in project XDEMO2 about login error"
   "Find issues that are 'In Progress' and assign them to me"
   "Transition issue XDEMO2-43 to Done"
   ```

2. **Project Information Summary**
   ```
   "Summarize all issues in project XDEMO2"
   "Who is assigned issues in project XDEMO2?"
   "List unassigned issues in the current sprint"
   ```

3. **Documentation with Confluence**
   ```
   "Create a new Confluence page named 'Meeting Notes 2025-05-03'"
   "Update the Confluence page about API Documentation with new examples and add label 'documentation'"
   "Add the label 'documentation' to the page about architecture"
   "Remove the label 'draft' from the page 'Meeting Notes'"
   "Add a comment to the Confluence page about API Documentation"
   ```

4. **Analysis and Reporting**
   ```
   "Compare the number of completed issues between the current and previous sprint"
   "Who has the most issues in 'To Do' status?"
   ```

### Usage Notes

1. **Simple JQL**: When searching for issues, use simple JQL without spaces or special characters (e.g., `project=XDEMO2` instead of `project = XDEMO2 AND key = XDEMO2-43`).

2. **Create Confluence Page**: When creating a Confluence page, use simple HTML content and do not specify parentId to avoid errors.

3. **Update Confluence Page**: When updating a page, always include the current version number to avoid conflicts. You can also update labels (add/remove) and must use valid storage format for content.

4. **Create Issue**: When creating new issues, only provide the minimum required fields (projectKey, summary) for best success.

5. **Access Rights**: Ensure the configured Atlassian account has access to the projects and spaces you want to interact with.

After installation, you can use Cline to interact with Jira and Confluence naturally, making project management and documentation more efficient. 