/**
 * Common schema definitions and utilities for MCP tools
 */

/**
 * Standard metadata interface for tool responses
 */
export interface StandardMetadata {
  total: number;          // Total number of records
  limit: number;          // Maximum number of records returned
  offset: number;         // Starting position
  hasMore: boolean;       // Whether there are more records
  links?: {               // Useful links
    self: string;         // Link to this data
    ui?: string;          // Link to Atlassian UI
    next?: string;        // Link to next page
  }
}

/**
 * Creates standard metadata object for tool responses
 */
export function createStandardMetadata(
  total: number,
  limit: number,
  offset: number,
  baseUrl: string,
  uiUrl?: string
): StandardMetadata {
  const hasMore = offset + limit < total;
  
  // Base metadata
  const metadata: StandardMetadata = {
    total,
    limit,
    offset,
    hasMore,
    links: {
      self: baseUrl
    }
  };
  
  // Add UI link if provided
  if (uiUrl) {
    metadata.links!.ui = uiUrl;
  }
  
  // Add next page link if there are more results
  if (hasMore) {
    // Parse the current URL
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('offset', String(offset + limit));
      url.searchParams.set('limit', String(limit));
      metadata.links!.next = url.toString();
    } catch (error) {
      // If URL parsing fails, construct a simple next link
      const separator = baseUrl.includes('?') ? '&' : '?';
      metadata.links!.next = `${baseUrl}${separator}offset=${offset + limit}&limit=${limit}`;
    }
  }
  
  return metadata;
}

/**
 * JSON Schema definition for standard metadata
 */
export const standardMetadataSchema = {
  type: "object",
  properties: {
    total: { type: "number", description: "Total number of records" },
    limit: { type: "number", description: "Maximum number of records returned" },
    offset: { type: "number", description: "Starting position" },
    hasMore: { type: "boolean", description: "Whether there are more records" },
    links: {
      type: "object",
      properties: {
        self: { type: "string", description: "Link to this resource" },
        ui: { type: "string", description: "Link to Atlassian UI" },
        next: { type: "string", description: "Link to next page" }
      }
    }
  },
  required: ["total", "limit", "offset", "hasMore"]
}; 