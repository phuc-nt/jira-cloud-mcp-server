/**
 * Utilities để tạo các phản hồi chuẩn MCP Protocol
 */

export interface McpResponse {
  content: Array<McpContent>;
  [key: string]: unknown;
  _meta?: Record<string, unknown>;
  isError?: boolean;
}

export type McpContent = 
  | { type: "text"; text: string; [key: string]: unknown }
  | { type: "image"; data: string; mimeType: string; [key: string]: unknown }
  | { type: "audio"; data: string; mimeType: string; [key: string]: unknown }
  | { 
      type: "resource"; 
      resource: 
        | { text: string; uri: string; mimeType?: string; [key: string]: unknown }
        | { uri: string; blob: string; mimeType?: string; [key: string]: unknown }
    };

/**
 * Tạo response text chuẩn cho MCP
 * @param text Nội dung text
 * @param additionalProps Thuộc tính bổ sung (không bắt buộc)
 * @returns Đối tượng response chuẩn MCP
 */
export function createTextResponse(text: string, additionalProps: Record<string, unknown> = {}): McpResponse {
  return {
    ...additionalProps,
    content: [
      { type: "text", text }
    ]
  };
}

/**
 * Chuyển đổi kết quả thành response text chuẩn cho MCP
 * @param result Kết quả cần chuyển đổi
 * @returns Đối tượng response chuẩn MCP
 */
export function createResponseFromResult(result: unknown): McpResponse {
  // Nếu kết quả là null hoặc undefined
  if (result === null || result === undefined) {
    return createTextResponse("No result");
  }

  // Nếu kết quả đã là McpResponse
  if (typeof result === 'object' && result !== null && 'content' in result) {
    return result as McpResponse;
  }

  // Nếu kết quả là một object
  if (typeof result === 'object') {
    const resultStr = JSON.stringify(result, null, 2);
    return createTextResponse(resultStr, result as Record<string, unknown>);
  }

  // Nếu kết quả là kiểu dữ liệu nguyên thủy
  return createTextResponse(String(result));
}

/**
 * Tạo response lỗi chuẩn cho MCP
 * @param errorMessage Thông báo lỗi
 * @param additionalProps Thuộc tính bổ sung (không bắt buộc)
 * @returns Đối tượng response lỗi chuẩn MCP
 */
export function createErrorResponse(errorMessage: string, additionalProps: Record<string, unknown> = {}): McpResponse {
  return {
    ...additionalProps,
    isError: true,
    content: [
      { type: "text", text: errorMessage }
    ]
  };
} 