# Kế hoạch Migration: Tái cấu trúc MCP Utils

## Checklist tiến độ migration (cập nhật mới nhất)

### Resource (Jira + Confluence)
- [x] Tạo helpers mới: `mcp-core.ts`, `mcp-helpers.ts`
- [x] Migrate toàn bộ resource Confluence:
  - [x] spaces.ts
  - [x] pages.ts (bao gồm migrate metadata từ content-metadata.ts)
  - [x] Xóa content-metadata.ts
- [x] Migrate toàn bộ resource Jira:
  - [x] issues.ts
  - [x] projects.ts
  - [x] boards.ts
  - [x] sprints.ts
  - [x] filters.ts
  - [x] dashboards.ts
  - [x] users.ts
- [x] Chuẩn hóa response, schema, context cho toàn bộ resource
- [x] Đảm bảo backward compatibility (giữ file tạm, không đổi format response đột ngột)
- [x] Test lại toàn bộ resource bằng test client, Cline, Cursor, ...
- [x] Cập nhật docs hướng dẫn mở rộng resource/tool đúng chuẩn refactor mới

### Tool (Jira + Confluence)
- [ ] Migrate toàn bộ tool Jira sang helpers mới (`Tools` trong mcp-helpers.ts)
- [x] Migrate toàn bộ tool Confluence sang helpers mới
- [x] Chuẩn hóa response, schema, context cho toàn bộ tool Confluence
- [x] Đảm bảo backward compatibility cho tool Confluence (giữ file tạm nếu cần)
- [x] Test lại toàn bộ tool Confluence bằng test client
- [x] Cập nhật docs hướng dẫn implement tool Confluence đúng chuẩn mới
- [ ] Chuẩn hóa response, schema, context cho toàn bộ tool Jira
- [ ] Đảm bảo backward compatibility cho tool Jira (giữ file tạm nếu cần)
- [ ] Test lại toàn bộ tool Jira bằng test client
- [ ] Cập nhật docs hướng dẫn implement tool Jira đúng chuẩn mới

---
## Hướng dẫn implement resource/tool (chuẩn mới)

### Resource
- Luôn import `Config`, `Resources` từ `../../utils/mcp-helpers.js`
- Không dùng hàm cũ từ mcp-resource.js, mcp-response.js
- Đăng ký resource qua `server.resource()` với ResourceTemplate, callback chuẩn hóa:
  - Ưu tiên lấy config từ context nếu có, fallback về env: 
    ```typescript
    const config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
      ? (extra.context as any).atlassianConfig
      : Config.getAtlassianConfigFromEnv();
    ```
  - Luôn trả về qua `Resources.createStandardResource(...)`, không trả về object tự do
  - Luôn có schema validate output, cập nhật schema nếu cần
  - Không đăng ký trùng URI pattern ở nhiều file
  - Không log credentials, không trả về thông tin nhạy cảm

### Tool
- Luôn import `Tools` từ `../../utils/mcp-helpers.js`
- Không dùng hàm cũ từ tool-helpers.js, mcp-response.js
- Đăng ký tool qua `server.tool()` hoặc `Tools.registerTool()` với schema input rõ ràng, callback chuẩn hóa:
  - Ưu tiên lấy config từ context nếu có, fallback về env
  - Luôn trả về qua `Tools.createToolResponse(...)`, không trả về object tự do
  - Luôn có schema validate input/output, cập nhật schema nếu cần
  - Không log credentials, không trả về thông tin nhạy cảm

---
## Tiến độ thực tế
- Đã migrate xong 100% resource (Jira + Confluence) và toàn bộ tool Confluence sang helpers mới, chuẩn hóa response, schema, context, giữ backward compatibility
- Đã test lại toàn bộ resource/tool Confluence thành công
- Tool Jira chưa migrate, cần thực hiện các bước checklist ở trên
- Docs hướng dẫn implement resource/tool đã cập nhật đúng thực tế refactor mới (tham khảo docs/introduction/resources-and-tools.md)

## Thiết kế mới

Thay vì 3 file hiện tại (`mcp-resource.ts`, `mcp-response.ts`, `tool-helpers.ts`), tái cấu trúc thành 2 module chính:

1. **`mcp-core.ts`**: Định nghĩa interfaces, types, và các hàm cơ bản để tạo responses
2. **`mcp-helpers.ts`**: Chứa các helper functions cho cả resources và tools, được tổ chức theo namespace

## Giai đoạn 1: Tạo cấu trúc mới

### 1.1. Tạo file `mcp-core.ts`

```typescript
// src/utils/mcp-core.ts
/**
 * Core interfaces and functions for MCP responses
 * This module provides the foundation for all MCP responses
 */

/**
 * Standard MCP response interface
 */
export interface McpResponse<T = any> {
  content: Array<McpContent>;
  isError?: boolean;
  data?: T;
}

/**
 * MCP content types
 */
export type McpContent = 
  | { mimeType: string; text: string; [key: string]: unknown }
  | { mimeType: string; data: string; [key: string]: unknown };

/**
 * Create a standard response with JSON content
 */
export function createJsonResponse<T>(data: T, mimeType = 'application/json'): McpResponse<T> {
  return {
    content: [
      {
        mimeType,
        text: JSON.stringify(data)
      }
    ],
    data
  };
}

/**
 * Create a standard success response
 */
export function createSuccessResponse(message: string, data?: any): McpResponse {
  return createJsonResponse({
    success: true,
    message,
    ...(data && { data })
  });
}

/**
 * Create a standard error response
 */
export function createErrorResponse(message: string, details?: any): McpResponse {
  return {
    content: [
      {
        mimeType: 'application/json',
        text: JSON.stringify({
          success: false,
          message,
          ...(details && { details })
        })
      }
    ],
    isError: true
  };
}
```

### 1.2. Tạo file `mcp-helpers.ts`

```typescript
// src/utils/mcp-helpers.ts
/**
 * Helper functions for MCP resources and tools
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createJsonResponse, createErrorResponse, createSuccessResponse } from './mcp-core.js';
import { ApiError, ApiErrorType } from './error-handler.js';
import { AtlassianConfig } from './atlassian-api-base.js';
import { Logger } from './logger.js';
import { StandardMetadata, createStandardMetadata } from '../schemas/common.js';

const logger = Logger.getLogger('MCPHelpers');

/**
 * Environment and configuration utilities
 */
export namespace Config {
  /**
   * Get Atlassian configuration from environment variables
   */
  export function getAtlassianConfigFromEnv(): AtlassianConfig {
    const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
    const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
    const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';

    if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
      logger.error('Missing Atlassian credentials in environment variables');
      throw new Error('Missing Atlassian credentials in environment variables');
    }

    return {
      baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
        ? `https://${ATLASSIAN_SITE_NAME}` 
        : ATLASSIAN_SITE_NAME,
      email: ATLASSIAN_USER_EMAIL,
      apiToken: ATLASSIAN_API_TOKEN
    };
  }

  /**
   * Helper to get Atlassian config from context or environment
   */
  export function getConfigFromContextOrEnv(context: any): AtlassianConfig {
    if (context?.atlassianConfig) {
      return context.atlassianConfig;
    }
    return getAtlassianConfigFromEnv();
  }
}

/**
 * Resource helper functions
 */
export namespace Resources {
  /**
   * Create a standardized resource response with metadata and schema
   */
  export function createStandardResource(
    uri: string,
    data: any[],
    dataKey: string,
    schema: any,
    totalCount: number,
    limit: number,
    offset: number,
    uiUrl?: string
  ): McpResponse {
    // Create standard metadata
    const metadata = createStandardMetadata(totalCount, limit, offset, uri, uiUrl);
    
    // Create response data object
    const responseData: Record<string, any> = {
      metadata: metadata
    };
    
    // Add the data with the specified key
    responseData[dataKey] = data;
    
    // Return formatted resource
    return {
      contents: [
        {
          uri: uri,
          mimeType: "application/json",
          text: JSON.stringify(responseData),
          schema: schema
        }
      ]
    };
  }

  /**
   * Extract paging parameters from resource URI or request
   */
  export function extractPagingParams(
    params: any,
    defaultLimit: number = 20,
    defaultOffset: number = 0
  ): { limit: number, offset: number } {
    let limit = defaultLimit;
    let offset = defaultOffset;
    
    if (params) {
      // Extract limit
      if (params.limit) {
        const limitParam = Array.isArray(params.limit) ? params.limit[0] : params.limit;
        const parsedLimit = parseInt(limitParam, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = parsedLimit;
        }
      }
      
      // Extract offset
      if (params.offset) {
        const offsetParam = Array.isArray(params.offset) ? params.offset[0] : params.offset;
        const parsedOffset = parseInt(offsetParam, 10);
        if (!isNaN(parsedOffset) && parsedOffset >= 0) {
          offset = parsedOffset;
        }
      }
    }
    
    return { limit, offset };
  }

  /**
   * Higher-order function that wraps a resource handler with error handling
   */
  export function wrapWithErrorHandling<T, P>(
    resourceName: string,
    handler: (params: P) => Promise<T>
  ): (params: P) => Promise<T> {
    return async (params: P): Promise<T> => {
      try {
        return await handler(params);
      } catch (error) {
        logger.error(`Error in resource ${resourceName}:`, error);
        
        // Convert to ApiError if not already
        const apiError = error instanceof ApiError 
          ? error 
          : new ApiError(
              ApiErrorType.RESOURCE_ERROR,
              `Error processing resource ${resourceName}: ${error instanceof Error ? error.message : String(error)}`,
              500,
              error instanceof Error ? error : new Error(String(error))
            );
            
        throw apiError;
      }
    };
  }
}

/**
 * Tool helper functions
 */
export namespace Tools {
  /**
   * Standardized response structure for MCP tools
   */
  export interface ToolResponse<T = any> {
    content: Array<{
      mimeType: string;
      text: string;
    }>;
    isError?: boolean;
  }

  /**
   * Create a standardized response for MCP tools
   */
  export function createToolResponse<T = any>(success: boolean, message?: string, data?: T): ToolResponse<T> {
    const response = {
      success,
      ...(message && { message }),
      ...(data && { data })
    };

    return {
      content: [
        {
          mimeType: 'application/json',
          text: JSON.stringify(response)
        }
      ]
    };
  }

  /**
   * Higher-order function to wrap a tool implementation with standardized error handling
   */
  export function wrapWithErrorHandling<T, P>(
    toolName: string,
    handler: (params: P) => Promise<T>
  ): (params: P) => Promise<ToolResponse<T>> {
    return async (params: P): Promise<ToolResponse<T>> => {
      try {
        // Execute the handler
        const result = await handler(params);
        
        // Return successful response with data
        return createToolResponse<T>(true, `${toolName} executed successfully`, result);
      } catch (error) {
        // Log the error
        logger.error(`Error executing tool ${toolName}:`, error);
        
        // Create appropriate error message
        let errorMessage: string;
        
        if (error instanceof ApiError) {
          errorMessage = error.message;
        } else {
          errorMessage = error instanceof Error ? error.message : String(error);
        }
        
        // Return standardized error response
        return createToolResponse(false, errorMessage);
      }
    };
  }

  /**
   * Register a tool with the MCP server
   */
  export function registerTool<P = any, R = any>(
    server: McpServer,
    name: string,
    schema: Record<string, any>,
    handler: (params: P, context: any) => Promise<R>,
    useErrorWrapper: boolean = true
  ): void {
    logger.info(`Registering tool: ${name}`);

    const wrappedHandler = useErrorWrapper 
      ? async (params: P, context: any): Promise<ToolResponse<R>> => {
          try {
            logger.debug(`Executing tool ${name} with params:`, params);
            const result = await handler(params, context);
            logger.debug(`Tool ${name} executed successfully`);
            return createToolResponse(true, `${name} completed successfully`, result);
          } catch (error: any) {
            logger.error(`Error in tool ${name}:`, error);
            // Convert to standardized response
            return createToolResponse(false, error instanceof Error ? error.message : String(error));
          }
        }
      : handler;
      
    server.tool(name, schema, wrappedHandler as any);
  }

  /**
   * Create a simple tool response with text content
   * @deprecated Use createToolResponse(true, message) instead
   */
  export function createSimpleToolResponse(text: string): ToolResponse {
    return {
      content: [{ type: 'text', text }] as any
    };
  }

  /**
   * Create an error response
   * @deprecated Use createToolResponse(false, errorMessage) instead
   */
  export function createErrorResponse(error: Error | string): ToolResponse {
    const message = error instanceof Error ? error.message : error;
    return {
      content: [{ type: 'text', text: `Error: ${message}` }] as any,
      isError: true
    };
  }
}
```

## Giai đoạn 2: Chuyển đổi các file hiện có

### 2.1. Tạo file tạm để đảm bảo tương thích ngược

```typescript
// src/utils/mcp-resource.ts (deprecated version)
import { Resources, Config } from './mcp-helpers.js';
import { Logger } from './logger.js';

const logger = Logger.getLogger('MCPResource');

// Re-export for backward compatibility
export const getAtlassianConfigFromEnv = Config.getAtlassianConfigFromEnv;
export const createJsonResource = Resources.createJsonResource;
export const createJsonResourceWithSchema = Resources.createJsonResourceWithSchema;
export const createStandardResource = Resources.createStandardResource;
export const extractPagingParams = Resources.extractPagingParams;

// Log deprecation warning
logger.warn('mcp-resource.ts is deprecated. Please use mcp-helpers.js (Resources namespace) instead.');
```

```typescript
// src/utils/tool-helpers.ts (deprecated version)
import { Tools } from './mcp-helpers.js';
import { Logger } from './logger.js';

const logger = Logger.getLogger('ToolHelpers');

// Re-export for backward compatibility
export const createToolResponse = Tools.createToolResponse;
export const createSimpleToolResponse = Tools.createSimpleToolResponse;
export const createErrorResponse = Tools.createErrorResponse;
export const wrapToolWithErrorHandling = Tools.wrapWithErrorHandling;
export const registerTool = Tools.registerTool;

// Log deprecation warning
logger.warn('tool-helpers.ts is deprecated. Please use mcp-helpers.js (Tools namespace) instead.');
```

```typescript
// src/utils/mcp-response.ts (deprecated version)
import { createJsonResponse, createErrorResponse, createSuccessResponse } from './mcp-core.js';
import { Logger } from './logger.js';

const logger = Logger.getLogger('MCPResponse');

// Re-export for backward compatibility
export interface McpResponse {
  content: Array<any>;
  [key: string]: unknown;
  _meta?: Record<string, unknown>;
  isError?: boolean;
}

export type McpContent = any;

export const createTextResponse = (text: string, additionalProps = {}) => {
  logger.warn('createTextResponse is deprecated. Please use mcp-core.js createSuccessResponse instead.');
  return {
    ...additionalProps,
    content: [
      { type: "text", text }
    ]
  };
};

export { createJsonResponse, createErrorResponse, createSuccessResponse };

// Log deprecation warning
logger.warn('mcp-response.ts is deprecated. Please use mcp-core.js instead.');
```

## Giai đoạn 3: Cập nhật các file sử dụng các module cũ

### 3.1. Cập nhật imports trong một số file chính

Ví dụ cho một số file cần cập nhật (không cập nhật tất cả ngay lập tức):

```typescript
// src/resources/jira/issues.ts
// Thay đổi từ
import { createStandardResource, extractPagingParams } from '../../utils/mcp-resource.js';
// Thành
import { Resources } from '../../utils/mcp-helpers.js';
// Và cập nhật các lệnh gọi
const { limit, offset } = Resources.extractPagingParams(params);
return Resources.createStandardResource(...);
```

```typescript
// src/tools/jira/create-issue.ts
// Thay đổi từ
import { createErrorResponse } from '../../utils/mcp-response.js';
// Thành
import { createErrorResponse } from '../../utils/mcp-core.js';
// Hoặc nếu sử dụng createToolResponse
import { Tools } from '../../utils/mcp-helpers.js';
return Tools.createToolResponse(false, 'Error message');
```

## Giai đoạn 4: Kiểm thử và Đảm bảo Tương thích

### 4.1. Kiểm thử từng phần

- Triển khai từng file mới và test riêng
- Xác nhận các file tạm cho tương thích ngược hoạt động đúng
- Kiểm tra type safety trong VS Code/TypeScript
- Chạy integration test với MCP Test Client

### 4.2. Cập nhật tài liệu

- Thêm hướng dẫn sử dụng module mới vào tài liệu phát triển
- Cập nhật schema metadata example nếu cần
- Thêm mục deprecation notice vào tài liệu cho các module cũ

## Giai đoạn 5: Cập nhật dần trong toàn bộ codebase

### 5.1. Lộ trình chuyển đổi dần dần

- Sprint 1: Triển khai cấu trúc mới và cập nhật 20% resource/tool
- Sprint 2: Cập nhật thêm 30% resource/tool còn lại
- Sprint 3: Cập nhật 50% còn lại và xem xét xóa bỏ file tạm
- Sprint 4: Xóa bỏ hoàn toàn các file tạm sau khi đã chuyển đổi xong

## Ước tính thời gian

- Giai đoạn 1 (Tạo cấu trúc mới): 1-2 ngày
- Giai đoạn 2 (File tạm tương thích ngược): 1 ngày
- Giai đoạn 3 (Cập nhật một số file chính): 2-3 ngày
- Giai đoạn 4 (Kiểm thử): 1-2 ngày
- Giai đoạn 5 (Cập nhật toàn bộ codebase): 1-2 tuần

## Lợi ích

1. **Cấu trúc rõ ràng**: Phân chia rõ ràng theo chức năng, không theo đối tượng sử dụng
2. **Giảm trùng lặp**: Không có định nghĩa và logic trùng lặp
3. **Dễ mở rộng**: Thêm chức năng mới dễ dàng hơn trong cấu trúc namespace
4. **Type-safe**: Tất cả đều được định nghĩa type đầy đủ
5. **Dễ dàng học và sử dụng**: Developers chỉ cần biết 2 file thay vì 3+ file

## Rủi ro và giảm thiểu

1. **Rủi ro**: Thay đổi lớn có thể gây ra lỗi không mong muốn
   - **Giảm thiểu**: Triển khai từng bước, giữ tương thích ngược, kiểm thử kỹ lưỡng

2. **Rủi ro**: Thời gian chuyển đổi toàn bộ codebase có thể kéo dài
   - **Giảm thiểu**: Tập trung vào các file/module quan trọng trước, sau đó mới đến các file ít dùng

3. **Rủi ro**: Định nghĩa interface mới có thể không bao quát đủ use case
   - **Giảm thiểu**: Xem xét tất cả các trường hợp sử dụng hiện tại, đảm bảo mở rộng được trong tương lai 