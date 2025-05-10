import { AtlassianConfig, logger, createBasicHeaders } from './atlassian-api-base.js';
import { normalizeAtlassianBaseUrl } from './atlassian-api-base.js';
import { ApiError, ApiErrorType } from './error-handler.js';

// Add issues to backlog
export async function addIssuesToBacklog(config: AtlassianConfig, boardId: string, issueKeys: string[]): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/backlog/issue`;
    const data = { issues: issueKeys };
    logger.debug(`Adding issues to backlog: ${issueKeys.join(', ')}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error adding issues to backlog:`, error);
    throw error;
  }
}

// Di chuyển issues từ backlog sang sprint
export async function removeIssuesFromBacklog(config: AtlassianConfig, boardId: string, sprintId: string, issueKeys: string[]): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue`;
    const data = { issues: issueKeys };
    logger.debug(`Moving issues from backlog to sprint ${sprintId}: ${issueKeys.join(', ')}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error moving issues from backlog to sprint:`, error);
    throw error;
  }
}

// Sắp xếp thứ tự backlog
export async function rankBacklogIssues(config: AtlassianConfig, boardId: string, issueKeys: string[], options: { rankBeforeIssue?: string, rankAfterIssue?: string } = {}): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/issue/rank`;
    const data: any = { issues: issueKeys };
    if (options.rankBeforeIssue) data.rankBeforeIssue = options.rankBeforeIssue;
    if (options.rankAfterIssue) data.rankAfterIssue = options.rankAfterIssue;
    logger.debug(`Ranking issues in backlog: ${issueKeys.join(', ')}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error ranking backlog issues:`, error);
    throw error;
  }
}

// Bắt đầu sprint
export async function startSprint(config: AtlassianConfig, sprintId: string, startDate: string, endDate: string, goal?: string): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}`;
    const data: any = {
      state: 'active',
      startDate,
      endDate
    };
    if (goal) data.goal = goal;
    logger.debug(`Starting sprint ${sprintId}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error starting sprint ${sprintId}:`, error);
    throw error;
  }
}

// Đóng sprint
export async function closeSprint(config: AtlassianConfig, sprintId: string, options: { completeDate?: string, moveToSprintId?: string, createNewSprint?: boolean } = {}): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}`;
    const data: any = {
      state: 'closed',
      ...options
    };
    logger.debug(`Closing sprint ${sprintId}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error closing sprint ${sprintId}:`, error);
    throw error;
  }
}

// Di chuyển issues giữa các sprint
export async function moveIssuesBetweenSprints(config: AtlassianConfig, fromSprintId: string, toSprintId: string, issueKeys: string[]): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    logger.debug(`Moving issues from sprint ${fromSprintId} to sprint ${toSprintId}: ${issueKeys.join(', ')}`);
    // Remove from old sprint
    const removeUrl = `${baseUrl}/rest/agile/1.0/sprint/${fromSprintId}/issue`;
    const removeResponse = await fetch(removeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ issues: issueKeys, remove: true }),
      credentials: 'omit',
    });
    if (!removeResponse.ok) {
      const responseText = await removeResponse.text();
      logger.error(`Jira API error (${removeResponse.status}):`, responseText);
      throw new Error(`Jira API error: ${removeResponse.status} ${responseText}`);
    }
    // Add to new sprint
    const addUrl = `${baseUrl}/rest/agile/1.0/sprint/${toSprintId}/issue`;
    const addResponse = await fetch(addUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ issues: issueKeys }),
      credentials: 'omit',
    });
    if (!addResponse.ok) {
      const responseText = await addResponse.text();
      logger.error(`Jira API error (${addResponse.status}):`, responseText);
      throw new Error(`Jira API error: ${addResponse.status} ${responseText}`);
    }
    return await addResponse.json();
  } catch (error) {
    logger.error(`Error moving issues between sprints:`, error);
    throw error;
  }
}

// Thêm issue vào board
export async function addIssueToBoard(config: AtlassianConfig, boardId: string, issueKey: string | string[]): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/backlog/issue`;
    const issues = Array.isArray(issueKey) ? issueKey : [issueKey];
    const data = { issues };
    logger.debug(`Adding issue(s) to board ${boardId}: ${Array.isArray(issueKey) ? issueKey.join(', ') : issueKey}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error adding issue to board:`, error);
    throw error;
  }
}

// Cấu hình cột board
export async function configureBoardColumns(config: AtlassianConfig, boardId: string, columns: any[]): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/board/${boardId}/configuration`;
    logger.debug(`Configuring columns for board ${boardId}`);
    // Get current config to merge
    const currentRes = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!currentRes.ok) {
      const responseText = await currentRes.text();
      logger.error(`Jira API error (${currentRes.status}):`, responseText);
      throw new Error(`Jira API error: ${currentRes.status} ${responseText}`);
    }
    const currentConfig = await currentRes.json();
    const data = { ...currentConfig, columnConfig: { columns } };
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error configuring board columns:`, error);
    throw error;
  }
}

// Tạo sprint mới
export async function createSprint(
  config: AtlassianConfig,
  boardId: string,
  name: string,
  startDate?: string,
  endDate?: string,
  goal?: string
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/sprint`;
    const data: any = {
      name,
      originBoardId: boardId
    };
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;
    if (goal) data.goal = goal;
    logger.debug(`Creating new sprint "${name}" for board ${boardId}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error creating sprint:`, error);
    throw error;
  }
}

// ... existing code ...
// (To be filled with the full code of the above functions, keeping their implementation unchanged) 