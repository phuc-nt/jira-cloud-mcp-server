/**
 * Interface Confluence API
 * Định nghĩa các cấu trúc dữ liệu cho Confluence API
 */

/**
 * Thông tin người dùng Confluence
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
 * Thông tin về Space
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
 * Thông tin về version
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
 * Loại nội dung Confluence
 */
export type ConfluenceContentType = 'page' | 'blogpost' | 'comment' | 'attachment';

/**
 * Nội dung body của content
 */
export interface ConfluenceBody {
  storage: {
    value: string;
    representation: 'storage' | 'view' | 'export_view' | 'styled_view' | 'anonymous_export_view';
  };
  _expandable?: Record<string, string>;
}

/**
 * Thông tin về một content trong Confluence
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
 * Tham số cho việc tạo nội dung mới
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
 * Tham số cho việc cập nhật nội dung
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
 * Tham số tìm kiếm không gian
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
 * Kết quả tìm kiếm không gian
 */
export interface SearchSpacesResult {
  results: ConfluenceSpace[];
  start: number;
  limit: number;
  size: number;
  _links?: Record<string, string>;
}

/**
 * Tham số tìm kiếm nội dung
 */
export interface SearchContentParams {
  cql: string;
  cqlcontext?: Record<string, string>;
  expand?: string[];
  start?: number;
  limit?: number;
}

/**
 * Kết quả tìm kiếm nội dung
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
 * Thông tin về một comment
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
 * Tham số cho việc tạo comment
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