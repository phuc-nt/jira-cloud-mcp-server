import { AtlassianConfig } from './atlassian-api-base.js';
import { callConfluenceApi } from './atlassian-api-base.js';

// Create a new Confluence page (API v2)
export async function createConfluencePageV2(config: AtlassianConfig, params: { spaceId: string, title: string, content: string, parentId?: string }): Promise<any> {
  // Validate content
  if (!params.content.trim().startsWith('<')) {
    throw new Error('Content must be in Confluence storage format (XML-like HTML).');
  }
  // Chuẩn bị payload
  const requestData: any = {
    spaceId: params.spaceId,
    title: params.title,
    body: {
      representation: 'storage',
      value: params.content
    }
  };
  if (params.parentId) requestData.parentId = params.parentId;
  // Gọi API tạo page
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages`,
    'POST',
    requestData
  );
}

// Update a Confluence page (API v2)
// Có thể update title hoặc body hoặc cả hai. Mỗi lần update phải tăng version.
export async function updateConfluencePageV2(config: AtlassianConfig, params: { pageId: string, title: string, content: string, version: number }): Promise<any> {
  const payload = {
    id: params.pageId,
    status: "current",
    title: params.title,
    body: {
      representation: "storage",
      value: params.content
    },
    version: {
      number: params.version
    }
  };
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(params.pageId)}`,
    'PUT',
    payload
  );
}

// Add a comment to a Confluence page (API v2)
export async function addConfluenceCommentV2(config: AtlassianConfig, params: { pageId: string, content: string }): Promise<any> {
  if (!params.content.trim().startsWith('<')) {
    throw new Error('Comment content must be in Confluence storage format (XML-like HTML).');
  }
  const requestData = {
    pageId: params.pageId,
    body: {
      representation: 'storage',
      value: params.content
    }
  };
  return await callConfluenceApi<any>(
    config,
    `/api/v2/footer-comments`,
    'POST',
    requestData
  );
}

// Delete a Confluence page (API v2)
export async function deleteConfluencePageV2(config: AtlassianConfig, params: { pageId: string, draft?: boolean, purge?: boolean }): Promise<any> {
  const query: string[] = [];
  if (params.draft) query.push('draft=true');
  if (params.purge) query.push('purge=true');
  const endpoint = `/api/v2/pages/${encodeURIComponent(params.pageId)}` + (query.length ? `?${query.join('&')}` : '');
  return await callConfluenceApi<any>(
    config,
    endpoint,
    'DELETE'
  );
}

// Update Confluence page title (API v2)
export async function updateConfluencePageTitleV2(config: AtlassianConfig, params: { pageId: string, title: string, version: number }): Promise<any> {
  const payload = {
    title: params.title,
    version: { number: params.version },
    status: "current"
  };
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(params.pageId)}/title`,
    'PUT',
    payload
  );
}

// Update a footer comment in Confluence (API v2)
export async function updateConfluenceFooterCommentV2(config: AtlassianConfig, params: { commentId: string|number, version: number, value: string, representation?: string, message?: string }): Promise<any> {
  const payload: any = {
    version: {
      number: params.version
    },
    body: {
      representation: params.representation || 'storage',
      value: params.value
    }
  };
  if (params.message) payload.version.message = params.message;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/footer-comments/${encodeURIComponent(params.commentId)}`,
    'PUT',
    payload
  );
}

// Delete a footer comment in Confluence (API v2)
export async function deleteConfluenceFooterCommentV2(config: AtlassianConfig, commentId: string|number): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/footer-comments/${encodeURIComponent(commentId)}`,
    'DELETE'
  );
} 