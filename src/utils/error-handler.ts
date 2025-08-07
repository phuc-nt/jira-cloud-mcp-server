import { Logger } from './logger.js';

// Initialize logger
const logger = Logger.getLogger('ErrorHandler');

/**
 * API Error Type
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
 * API Error
 */
export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly statusCode: number;
  readonly code: string;
  readonly originalError?: Error;

  /**
   * Initialize ApiError
   * @param type Error type
   * @param message Error message
   * @param statusCode HTTP status code
   * @param originalError Original error (optional)
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
    this.code = type; // Use ApiErrorType as code
    this.originalError = originalError;

    // Log error
    logger.error(`${type}: ${message}`, {
      statusCode,
      code: this.code,
      originalError: originalError?.message
    });
  }

  /**
   * Convert ApiError to JSON string
   * @returns JSON representation of the error
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
 * Handle error from Atlassian API
 * @param error Error to handle
 * @returns Normalized ApiError
 */
export function handleAtlassianError(error: any): ApiError {
  // If already an ApiError, return it
  if (error instanceof ApiError) {
    return error;
  }
  
  // Handle HTTP error from Atlassian API
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          data.message || 'Invalid data',
          400,
          error
        );
      case 401:
        return new ApiError(
          ApiErrorType.AUTHENTICATION_ERROR,
          'Authentication failed. Please check your API token.',
          401,
          error
        );
      case 403:
        return new ApiError(
          ApiErrorType.AUTHORIZATION_ERROR,
          'You do not have permission to access this resource.',
          403,
          error
        );
      case 404:
        return new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          'Requested resource not found.',
          404,
          error
        );
      case 429:
        return new ApiError(
          ApiErrorType.RATE_LIMIT_ERROR,
          'Rate limit exceeded. Please try again later.',
          429,
          error
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new ApiError(
          ApiErrorType.SERVER_ERROR,
          'Atlassian server error.',
          status,
          error
        );
      default:
        return new ApiError(
          ApiErrorType.UNKNOWN_ERROR,
          `Unknown error (${status})`,
          status,
          error
        );
    }
  }

  // Handle network error
  if (error.request) {
    return new ApiError(
      ApiErrorType.NETWORK_ERROR,
      'Cannot connect to Atlassian API.',
      0,
      error
    );
  }

  // Other errors
  return new ApiError(
    ApiErrorType.UNKNOWN_ERROR,
    error.message || 'Unknown error',
    500,
    error
  );
}

/**
 * Utility function to handle errors when calling API
 * @param fn Function to handle errors for
 * @returns Function with error handling
 */
export function withErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch(error => {
    throw handleAtlassianError(error);
  });
}

 