import { Logger } from './logger.js';

// Khởi tạo logger
const logger = Logger.getLogger('ErrorHandler');

/**
 * Loại lỗi API
 */
export enum ApiErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Lỗi API
 */
export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly statusCode: number;
  readonly code: string;
  readonly originalError?: Error;

  /**
   * Khởi tạo ApiError
   * @param type Loại lỗi
   * @param message Thông báo lỗi
   * @param statusCode HTTP status code
   * @param originalError Lỗi gốc (nếu có)
   */
  constructor(
    type: ApiErrorType,
    message: string,
    statusCode: number = 500,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.code = type; // Sử dụng ApiErrorType làm code
    this.originalError = originalError;

    // Ghi log lỗi
    logger.error(`${type}: ${message}`, {
      statusCode,
      code: this.code,
      originalError: originalError?.message
    });
  }

  /**
   * Chuyển đổi ApiError thành chuỗi JSON
   * @returns Chuỗi JSON biểu diễn lỗi
   */
  toJSON(): Record<string, any> {
    return {
      error: true,
      type: this.type,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode
    };
  }
}

/**
 * Xử lý lỗi từ Atlassian API
 * @param error Lỗi cần xử lý
 * @returns ApiError đã được chuẩn hóa
 */
export function handleAtlassianError(error: any): ApiError {
  // Xử lý lỗi HTTP từ Atlassian API
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          data.message || 'Dữ liệu không hợp lệ',
          400,
          error
        );
      case 401:
        return new ApiError(
          ApiErrorType.AUTHENTICATION_ERROR,
          'Xác thực không thành công. Vui lòng kiểm tra API token',
          401,
          error
        );
      case 403:
        return new ApiError(
          ApiErrorType.AUTHORIZATION_ERROR,
          'Không có quyền truy cập vào tài nguyên này',
          403,
          error
        );
      case 404:
        return new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          'Không tìm thấy tài nguyên yêu cầu',
          404,
          error
        );
      case 429:
        return new ApiError(
          ApiErrorType.RATE_LIMIT_ERROR,
          'Đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau',
          429,
          error
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new ApiError(
          ApiErrorType.SERVER_ERROR,
          'Lỗi máy chủ Atlassian',
          status,
          error
        );
      default:
        return new ApiError(
          ApiErrorType.UNKNOWN_ERROR,
          `Lỗi không xác định (${status})`,
          status,
          error
        );
    }
  }

  // Xử lý lỗi mạng
  if (error.request) {
    return new ApiError(
      ApiErrorType.NETWORK_ERROR,
      'Không thể kết nối đến Atlassian API',
      0,
      error
    );
  }

  // Các lỗi khác
  return new ApiError(
    ApiErrorType.UNKNOWN_ERROR,
    error.message || 'Lỗi không xác định',
    500,
    error
  );
}

/**
 * Hàm tiện ích để xử lý lỗi khi gọi API
 * @param fn Hàm cần xử lý lỗi
 * @returns Hàm đã được xử lý lỗi
 */
export function withErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch(error => {
    throw handleAtlassianError(error);
  });
} 