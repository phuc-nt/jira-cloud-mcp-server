import { AtlassianConfig } from './atlassian-api-base.js';
import { callConfluenceApi } from './atlassian-api-base.js';

// Get labels of a Confluence page (API v2, cursor-based)
export async function getConfluencePageLabelsV2(config: AtlassianConfig, pageId: string, cursor?: string, limit: number = 25): Promise<any> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/labels`,
    'GET',
    null,
    params
  );
}

// Get attachments of a Confluence page (API v2, cursor-based)
export async function getConfluencePageAttachmentsV2(config: AtlassianConfig, pageId: string, cursor?: string, limit: number = 25): Promise<any> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/attachments`,
    'GET',
    null,
    params
  );
}

// Get versions of a Confluence page (API v2, cursor-based)
export async function getConfluencePageVersionsV2(config: AtlassianConfig, pageId: string, cursor?: string, limit: number = 25): Promise<any> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/versions`,
    'GET',
    null,
    params
  );
}

// Get list of Confluence pages (API v2, cursor-based)
export async function getConfluencePagesV2(config: AtlassianConfig, cursor?: string, limit: number = 25): Promise<any> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages`,
    'GET',
    null,
    params
  );
}

// Get Confluence page details (API v2, metadata only)
export async function getConfluencePageV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}`,
    'GET'
  );
}

// Get Confluence page body (API v2)
export async function getConfluencePageBodyV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/body`,
    'GET'
  );
}

// Get Confluence page ancestors (API v2)
export async function getConfluencePageAncestorsV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/ancestors`,
    'GET'
  );
}

// Get list of Confluence spaces (API v2, cursor-based)
export async function getConfluenceSpacesV2(config: AtlassianConfig, cursor?: string, limit: number = 25): Promise<any> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/spaces`,
    'GET',
    null,
    params
  );
}

// Get Confluence space details (API v2)
export async function getConfluenceSpaceV2(config: AtlassianConfig, spaceKey: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/spaces/${encodeURIComponent(spaceKey)}`,
    'GET'
  );
}

// Get children of a Confluence page (API v2)
export async function getConfluencePageChildrenV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/children`,
    'GET'
  );
}

// Get footer comments of a Confluence page (API v2)
export async function getConfluencePageFooterCommentsV2(config: AtlassianConfig, pageId: string, params: { limit?: number, cursor?: string } = {}): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/footer-comments`,
    'GET',
    null,
    params
  );
}

// Get inline comments of a Confluence page (API v2)
export async function getConfluencePageInlineCommentsV2(config: AtlassianConfig, pageId: string, params: { limit?: number, cursor?: string } = {}): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/inline-comments`,
    'GET',
    null,
    params
  );
}

// Get list of Confluence pages (API v2, hỗ trợ filter nâng cao)
export async function getConfluencePagesWithFilters(config: AtlassianConfig, filters: Record<string, any> = {}): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    '/api/v2/pages',
    'GET',
    null,
    filters
  );
} 