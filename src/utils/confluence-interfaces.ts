/**
 * Confluence API Interface
 * Define data structures for Confluence API
 */

/**
 * Confluence user information
 */
export interface ConfluenceUser {
  accountId: string;
  email?: string;
  displayName: string;
  publicName?: string;
  profilePicture: {
    path: string;
    width: number;
    height: number;
    isDefault: boolean;
  };
}

/**
 * Space information
 */
export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  type: 'global' | 'personal';
  status: 'current';
  _expandable?: Record<string, string>;
  _links?: Record<string, string>;
}

/**
 * Version information
 */
export interface ConfluenceVersion {
  by: ConfluenceUser;
  when: string;
  number: number;
  message?: string;
  minorEdit: boolean;
  hidden: boolean;
}

/**
 * Confluence content type
 */
export type ConfluenceContentType = 'page' | 'blogpost' | 'comment' | 'attachment';

/**
 * Content body
 */
export interface ConfluenceBody {
  storage: {
    value: string;
    representation: 'storage' | 'view' | 'export_view' | 'styled_view' | 'anonymous_export_view';
  };
  _expandable?: Record<string, string>;
}

/**
 * Content information in Confluence
 */
export interface ConfluenceContent {
  id: string;
  type: ConfluenceContentType;
  status: 'current' | 'trashed' | 'historical' | 'draft';
  title: string;
  space?: ConfluenceSpace;
  version?: ConfluenceVersion;
  body?: ConfluenceBody;
  ancestors?: ConfluenceContent[];
  children?: {
    page?: {
      results: ConfluenceContent[];
      size: number;
    };
    comment?: {
      results: ConfluenceContent[];
      size: number;
    };
    attachment?: {
      results: ConfluenceContent[];
      size: number;
    };
  };
  descendants?: {
    page?: {
      results: ConfluenceContent[];
      size: number;
    };
    comment?: {
      results: ConfluenceContent[];
      size: number;
    };
    attachment?: {
      results: ConfluenceContent[];
      size: number;
    };
  };
  container?: {
    id: string;
    type: ConfluenceContentType;
    _links?: Record<string, string>;
  };
  metadata?: {
    labels?: {
      results: {
        prefix: string;
        name: string;
        id: string;
      }[];
      size: number;
    };
    currentuser?: Record<string, any>;
    properties?: Record<string, any>;
  };
  restrictions?: {
    read?: {
      restrictions: {
        group?: {
          name: string;
          type: string;
        };
        user?: ConfluenceUser;
      }[];
      operation: 'read';
    };
    update?: {
      restrictions: {
        group?: {
          name: string;
          type: string;
        };
        user?: ConfluenceUser;
      }[];
      operation: 'update';
    };
  };
  _expandable?: Record<string, string>;
  _links?: Record<string, string>;
}

/**
 * Parameters for creating new content
 */
export interface CreateContentParams {
  type: ConfluenceContentType;
  space: {
    key: string;
  };
  title: string;
  body: {
    storage: {
      value: string;
      representation: 'storage';
    };
  };
  ancestors?: {
    id: string;
  }[];
  status?: 'current' | 'draft';
}

/**
 * Parameters for updating content
 */
export interface UpdateContentParams {
  type?: ConfluenceContentType;
  title?: string;
  body?: {
    storage: {
      value: string;
      representation: 'storage';
    };
  };
  version: {
    number: number;
  };
  status?: 'current' | 'draft';
}

/**
 * Parameters for searching spaces
 */
export interface SearchSpacesParams {
  keys?: string[];
  type?: 'global' | 'personal';
  status?: 'current' | 'archived';
  label?: string;
  expand?: string[];
  start?: number;
  limit?: number;
}

/**
 * Search result for spaces
 */
export interface SearchSpacesResult {
  results: ConfluenceSpace[];
  start: number;
  limit: number;
  size: number;
  _links?: Record<string, string>;
}

/**
 * Parameters for searching content
 */
export interface SearchContentParams {
  cql: string;
  cqlcontext?: Record<string, string>;
  expand?: string[];
  start?: number;
  limit?: number;
}

/**
 * Search result for content
 */
export interface SearchContentResult {
  results: ConfluenceContent[];
  start: number;
  limit: number;
  size: number;
  totalSize?: number;
  cqlQuery?: string;
  searchDuration?: number;
  _links?: Record<string, string>;
}

/**
 * Information about a comment
 */
export interface ConfluenceComment {
  id: string;
  type: 'comment';
  status: 'current' | 'trashed' | 'historical' | 'draft';
  title: string;
  body: ConfluenceBody;
  version: ConfluenceVersion;
  container: {
    id: string;
    type: ConfluenceContentType;
    _links?: Record<string, string>;
  };
  _expandable?: Record<string, string>;
  _links?: Record<string, string>;
}

/**
 * Parameters for creating a comment
 */
export interface CreateCommentParams {
  body: {
    storage: {
      value: string;
      representation: 'storage';
    };
  };
  container: {
    id: string;
    type: ConfluenceContentType;
  };
  status?: 'current' | 'draft';
} 