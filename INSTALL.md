# MCP Jira Server Installation Guide

> **Production-Ready Jira Integration** - Connect AI assistants to Jira Cloud with modular architecture

## System Requirements

- macOS 10.15+ or Windows 10+
- Node.js 16+ (for running the MCP server)
- Jira Cloud workspace access with API token
- MCP-compatible client (Claude Desktop, Cline, Cursor, or other MCP clients)

## Installation Methods

### 🚀 Method 1: NPM Installation (Recommended)

**Quick install from npm registry:**

```bash
npm install -g mcp-jira-cloud-server
```

**That's it!** Skip to [Step 2: Get Jira API Credentials](#step-2-get-jira-api-credentials) below.

### 🔧 Method 2: Manual Installation from Source

**For development or customization:**

#### Prerequisites Check

Verify Git and Node.js are installed:

```bash
git --version
node --version
npm --version
```

#### Step 1: Clone Repository

```bash
git clone https://github.com/phuc-nt/mcp-jira-cloud-server.git
cd mcp-jira-cloud-server
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Build the Project

```bash
npm run build
```

## Step 2: Get Jira API Credentials

### Create Jira API Token

1. **Go to Atlassian Account Settings**: [API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. **Create API Token**:
   - Click "Create API token"
   - Give it a descriptive name (e.g., "MCP Server")
   - Copy and securely store the token
3. **Get Your Site Information**:
   - Your site name: from URL `https://your-site.atlassian.net`
   - Your email: the email associated with your Atlassian account

### Required Permissions

Make sure your account has these Jira permissions:
- **Browse Projects**: View project and issue data
- **Create Issues**: Create new issues and stories
- **Edit Issues**: Update and modify existing issues
- **Manage Sprints**: Create and manage agile sprints (for Agile module)
- **Administer Projects**: Dashboard management (for Dashboard module)

## Step 3: Find Your Global NPM Installation Path

First, find where npm installed the package globally:

```bash
which mcp-jira-cloud-server
```

**Copy this path** - you'll need it for the configuration below.

**Common paths:**

- **macOS (Homebrew):** `/opt/homebrew/bin/mcp-jira-cloud-server`
- **macOS (Node.js):** `/usr/local/bin/mcp-jira-cloud-server`
- **Linux:** `/usr/local/bin/mcp-jira-cloud-server`
- **Windows:** `C:\Users\{username}\AppData\Roaming\npm\mcp-jira-cloud-server.cmd`

## Step 4: Configure Your AI Client

### Configuration Format

**Important:** Use the following format for reliable MCP connections:

```json
{
  "mcpServers": {
    "server-name": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio", 
      "command": "node",
      "args": ["/path/to/binary"],
      "env": { /* environment variables */ }
    }
  }
}
```

**Key points:**
- Use `"command": "node"` with `"args": ["/path/to/binary"]` format
- Include `"type": "stdio"` and `"timeout": 60` for stability
- Set `"disabled": false` to ensure module is active

### Deployment Options

Choose the configuration that best fits your needs:

### 🔧 Option A: Essential Stack (Recommended - 28 tools)
**Core + Search modules for essential operations:**

```json
{
  "mcpServers": {
    "jira-core": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/opt/homebrew/bin/mcp-jira-core"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    },
    "jira-search": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/opt/homebrew/bin/mcp-jira-search"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### 🏃‍♂️ Option B: Complete Agile Team (38 tools)
**Core + Agile + Search for full agile workflow:**

```json
{
  "mcpServers": {
    "jira-core": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/opt/homebrew/bin/mcp-jira-core"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com", 
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    },
    "jira-agile": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/opt/homebrew/bin/mcp-jira-agile"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    },
    "jira-search": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/opt/homebrew/bin/mcp-jira-search"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### 📊 Option C: Analytics Focus (22 tools)
**Search + Dashboard for reporting and analytics:**

```json
{
  "mcpServers": {
    "jira-search": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/opt/homebrew/bin/mcp-jira-search"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    },
    "jira-dashboard": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/opt/homebrew/bin/mcp-jira-dashboard"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### 🎯 Option D: Legacy Monolithic (All 46 tools)
**Single server with all functionality:**

```json
{
  "mcpServers": {
    "jira": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/opt/homebrew/bin/mcp-jira-cloud-server"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Alternative: Manual Installation from Source

If you built from source instead of using npm:

```json
{
  "mcpServers": {
    "jira-core": {
      "command": "node",
      "args": ["/full/path/to/mcp-jira-cloud-server/dist/modules/core",
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site-name",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Configuration Parameters Explained

**Required Environment Variables:**

- `ATLASSIAN_SITE_NAME`: Your Jira site name (e.g., if your URL is `https://mycompany.atlassian.net`, use `mycompany`)
- `ATLASSIAN_USER_EMAIL`: Your Atlassian account email address
- `ATLASSIAN_API_TOKEN`: Your API token from step 2

**⚠️ Important:** Replace `/opt/homebrew/bin/mcp-jira-cloud-server` with **your actual path** from the `which` command above.

### Supported MCP Clients

This server works with all major MCP clients:

- **✅ Claude Desktop** - Use the configuration above
- **✅ Cline** - Use the same configuration format
- **✅ Cursor** - Use the same configuration format  
- **✅ Other MCP clients** - Use the same configuration format

### Find Your Full Path (for Manual Installation)

**macOS/Linux:**

```bash
pwd
# Use the output + /dist/modules/core (or other module)
```

**Windows (PowerShell):**

```bash
(Get-Location).Path
# Use the output + \dist\modules\core (or other module)
```

**Example paths:**

- macOS: `/Users/yourname/mcp-jira-cloud-server/dist/modules/core`
- Windows: `C:\\Users\\YourName\\mcp-jira-cloud-server\\dist\\modules\\core`

## Step 5: Verify Installation

### Test MCP Server Directly

```bash
# Test main server
node ./dist/index.js

# Test individual modules  
node ./dist/modules/core/index.js
node ./dist/modules/search/index.js
```

You should see output showing tools registered successfully.

### Test with Your AI Client

After restarting your AI client, test with questions like:

- "List all projects in my Jira workspace"
- "Search for issues assigned to me that are in progress"
- "Create a new story in the DEMO project"
- "Get details about issue DEMO-123"

## 🎉 Installation Complete!

Your MCP Jira Server is now ready with **46 optimized tools** and **100% test success rate**.

**What you can do now:**

- Create and manage issues with natural language
- Search your Jira data with advanced filtering
- Manage agile workflows and sprints
- Create dashboards and analytics reports
- Integrate Jira operations directly into your AI workflow

**Need help?** Check the troubleshooting section or visit our [GitHub repository](https://github.com/phuc-nt/mcp-jira-cloud-server) for support.

**Ready to explore?** Start with simple commands like _"List all my assigned issues"_ or _"Create a new story in project ABC"_.

---

**✅ Production-ready Jira integration achieved with modular architecture!**