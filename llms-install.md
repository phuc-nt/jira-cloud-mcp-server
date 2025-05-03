# MCP Atlassian Server Installation Guide for AI

> **Important Note:** MCP Atlassian Server is primarily developed and optimized for use with the Cline AI assistant. While it follows the MCP standard and can work with other compatible MCP clients, the best performance and experience are achieved with Cline.

## System Requirements
- macOS 10.15+ or Windows 10+
- Atlassian Cloud account and API token
- Cline AI assistant (main supported client)

## Prerequisite Tools Check & Installation

### Check Installed Tools

Verify that Git, Node.js, and npm are installed:

```bash
git --version
node --version
npm --version
```

If the above commands show version numbers, you have the required tools. If not, follow the steps below:

### Install Git

#### macOS
**Method 1**: Using Homebrew (recommended)
```bash
# Install Homebrew if not available
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git
brew install git
```

**Method 2**: Install Xcode Command Line Tools
```bash
xcode-select --install
```

#### Windows
1. Download the Git installer from [git-scm.com](https://git-scm.com/download/win)
2. Run the installer with default options
3. After installation, open Command Prompt or PowerShell and check: `git --version`

### Install Node.js and npm

#### macOS
**Method 1**: Using Homebrew (recommended)
```bash
brew install node
```

**Method 2**: Using nvm (Node Version Manager)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Install Node.js LTS
nvm install --lts
```

#### Windows
1. Download Node.js installer from [nodejs.org](https://nodejs.org/) (choose LTS version)
2. Run the installer with default options
3. After installation, open Command Prompt or PowerShell and check:
   ```
   node --version
   npm --version
   ```

## Step 1: Clone the Repository
```bash
# macOS/Linux
git clone https://github.com/phuc-nt/mcp-atlassian-server.git
cd mcp-atlassian-server

# Windows
git clone https://github.com/phuc-nt/mcp-atlassian-server.git
cd mcp-atlassian-server
```

## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Build the Project
```bash
npm run build
```

## Step 4: Configure Cline

MCP Atlassian Server is specifically designed for seamless integration with Cline. Below is the guide to configure Cline to connect to the server:

### Determine the Full Path

First, determine the full path to your project directory:

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
        "/full/path/to/mcp-atlassian-server/dist/index.js"
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

> **Note for Windows**: The path on Windows may look like `C:\\Users\\YourName\\mcp-atlassian-server\\dist\\index.js` (use `\\` instead of `/`).

## Step 5: Get Atlassian API Token
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

## Step 6: Docker Configuration (Optional)

If you want to use Docker instead of local Node.js:

### Install Docker
- **macOS**: Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
- **Windows**: Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

After installing Docker, add this configuration to `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "atlassian-docker": {
      "disabled": false,
      "timeout": 60,
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "ATLASSIAN_SITE_NAME",
        "-e", "ATLASSIAN_USER_EMAIL",
        "-e", "ATLASSIAN_API_TOKEN",
        "your-docker-image"
      ],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Verify Installation
After configuration, test the connection by asking Cline a question related to Jira or Confluence, for example:
- "List all projects in Jira"
- "Search for Confluence pages about [topic]"

Cline is optimized to work with this MCP Atlassian Server and will automatically use the most appropriate resources and tools for your queries.

## Introduction & Usage Scenarios

### Capabilities of MCP Atlassian Server

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

#### Confluence Interactions
- Create new pages with simple HTML content
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

3. **Create Issue**: When creating new issues, only provide the minimum required fields (projectKey, summary) for best success.

4. **Access Rights**: Ensure the configured Atlassian account has access to the projects and spaces you want to interact with.

After installation, you can use Cline to interact with Jira and Confluence naturally, making project management and documentation more efficient.