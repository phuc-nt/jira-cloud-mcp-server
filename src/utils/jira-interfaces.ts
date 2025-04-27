/**
 * Interface Jira API
 * Định nghĩa các cấu trúc dữ liệu cho Jira API
 */

/**
 * Interface định nghĩa các kiểu dữ liệu cho Jira API
 */

/**
 * Định nghĩa thông tin người dùng Jira
 */
export interface JiraUser {
  accountId: string;
  emailAddress?: string;
  displayName: string;
  active: boolean;
  timeZone?: string;
  accountType: string;
  avatarUrls?: {
    '48x48'?: string;
    '24x24'?: string;
    '16x16'?: string;
    '32x32'?: string;
  };
  self: string;
}

/**
 * Định nghĩa thông tin dự án Jira
 */
export interface JiraProject {
  id: string;
  key: string;
  name: string;
  self: string;
  avatarUrls?: Record<string, string>;
  projectCategory?: {
    id: string;
    name: string;
    description?: string;
  };
  simplified?: boolean;
  style?: string;
  isPrivate?: boolean;
}

/**
 * Định nghĩa loại issue
 */
export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl: string;
  subtask: boolean;
  avatarId?: number;
  entityId?: string;
  hierarchyLevel?: number;
  self: string;
}

/**
 * Định nghĩa trạng thái issue
 */
export interface JiraStatus {
  id: string;
  name: string;
  description?: string;
  statusCategory: {
    id: number;
    key: string;
    name: string;
    colorName: string;
    self: string;
  };
  self: string;
}

/**
 * Định nghĩa trường custom field
 */
export interface JiraCustomField {
  id: string;
  key?: string;
  name?: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames?: string[];
  schema?: {
    type: string;
    custom?: string;
    customId?: number;
    items?: string;
  };
}

/**
 * Định nghĩa priority của issue
 */
export interface JiraPriority {
  id: string;
  name: string;
  iconUrl: string;
  self: string;
}

/**
 * Định nghĩa người tạo/cập nhật
 */
export interface JiraUserDetails {
  self: string;
  accountId: string;
  displayName: string;
  active: boolean;
}

/**
 * Định nghĩa thông tin version/cập nhật
 */
export interface JiraVersionInfo {
  by: JiraUserDetails;
  when: string;
}

/**
 * Định nghĩa nội dung rich text
 */
export interface JiraContent {
  type: string;
  content?: JiraContent[];
  text?: string;
  attrs?: Record<string, any>;
}

/**
 * Định nghĩa định dạng nội dung
 */
export interface JiraBody {
  type: string;
  version: number;
  content: JiraContent[];
}

/**
 * Định nghĩa comment
 */
export interface JiraComment {
  id: string;
  self: string;
  body: any;
  author: {
    accountId: string;
    displayName: string;
    emailAddress?: string;
    avatarUrls?: Record<string, string>;
  };
  created: string;
  updated: string;
}

/**
 * Định nghĩa danh sách comment
 */
export interface JiraComments {
  comments: JiraComment[];
  maxResults: number;
  total: number;
  startAt: number;
}

/**
 * Định nghĩa trạng thái chuyển đổi
 */
export interface JiraTransition {
  id: string;
  name: string;
  to: JiraStatus;
  hasScreen: boolean;
  isGlobal: boolean;
  isInitial: boolean;
  isConditional: boolean;
  isAvailable: boolean;
}

/**
 * Định nghĩa kết quả trạng thái chuyển đổi
 */
export interface JiraTransitionsResult {
  transitions: {
    id: string;
    name: string;
    to: {
      id: string;
      name: string;
      statusCategory?: {
        id: number;
        key: string;
        name: string;
      };
    };
  }[];
}

/**
 * Định nghĩa thông tin tệp đính kèm
 */
export interface JiraAttachment {
  id: string;
  filename: string;
  author: JiraUserDetails;
  created: string;
  size: number;
  mimeType: string;
  content: string;
  thumbnail?: string;
  self: string;
}

/**
 * Định nghĩa issue trong Jira
 */
export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: any;
    issuetype: {
      id: string;
      name: string;
      iconUrl?: string;
    };
    project: {
      id: string;
      key: string;
      name: string;
    };
    status?: {
      id: string;
      name: string;
      statusCategory?: {
        id: number;
        key: string;
        name: string;
      };
    };
    priority?: {
      id: string;
      name: string;
    };
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress?: string;
      avatarUrls?: Record<string, string>;
    };
    reporter?: {
      accountId: string;
      displayName: string;
      emailAddress?: string;
      avatarUrls?: Record<string, string>;
    };
    created?: string;
    updated?: string;
    [key: string]: any;
  };
  changelog?: {
    histories: {
      id: string;
      author: JiraUserDetails;
      created: string;
      items: {
        field: string;
        fieldtype: string;
        from?: string;
        fromString?: string;
        to?: string;
        toString?: string;
      }[];
    }[];
  };
}

/**
 * Định nghĩa kết quả tìm kiếm
 */
export interface JiraSearchResult {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

/**
 * Định nghĩa tham số tìm kiếm
 */
export interface JiraSearchParams {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
  validateQuery?: boolean;
  expand?: string[];
}

/**
 * Định nghĩa tham số tạo issue
 */
export interface JiraCreateIssueParams {
  fields: {
    summary: string;
    issuetype: {
      id: string;
    };
    project: {
      id: string;
    };
    description?: any;
    [key: string]: any;
  };
  update?: any;
} 