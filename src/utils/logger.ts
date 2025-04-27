import dotenv from 'dotenv';

// Tải biến môi trường
dotenv.config();

// Định nghĩa các cấp độ log
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Định nghĩa màu cho output
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  GRAY: '\x1b[90m'
};

// Lấy cấp độ log từ biến môi trường
const getLogLevelFromEnv = (): LogLevel => {
  const logLevel = process.env.LOG_LEVEL?.toLowerCase();
  switch (logLevel) {
    case 'debug':
      return LogLevel.DEBUG;
    case 'info':
      return LogLevel.INFO;
    case 'warn':
      return LogLevel.WARN;
    case 'error':
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO; // Mặc định là INFO
  }
};

/**
 * Logger utility
 */
export class Logger {
  private static logLevel = getLogLevelFromEnv();
  private moduleName: string;

  /**
   * Khởi tạo logger
   * @param moduleName Tên module sử dụng logger
   */
  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }

  /**
   * Log lỗi
   * @param message Nội dung log
   * @param data Dữ liệu bổ sung (tùy chọn)
   */
  error(message: string, data?: any): void {
    if (Logger.logLevel >= LogLevel.ERROR) {
      console.error(`${COLORS.RED}[ERROR][${this.moduleName}]${COLORS.RESET} ${message}`);
      if (data) console.error(data);
    }
  }

  /**
   * Log cảnh báo
   * @param message Nội dung log
   * @param data Dữ liệu bổ sung (tùy chọn)
   */
  warn(message: string, data?: any): void {
    if (Logger.logLevel >= LogLevel.WARN) {
      console.warn(`${COLORS.YELLOW}[WARN][${this.moduleName}]${COLORS.RESET} ${message}`);
      if (data) console.warn(data);
    }
  }

  /**
   * Log thông tin
   * @param message Nội dung log
   * @param data Dữ liệu bổ sung (tùy chọn)
   */
  info(message: string, data?: any): void {
    if (Logger.logLevel >= LogLevel.INFO) {
      console.info(`${COLORS.BLUE}[INFO][${this.moduleName}]${COLORS.RESET} ${message}`);
      if (data) console.info(data);
    }
  }

  /**
   * Log debug
   * @param message Nội dung log
   * @param data Dữ liệu bổ sung (tùy chọn)
   */
  debug(message: string, data?: any): void {
    if (Logger.logLevel >= LogLevel.DEBUG) {
      console.debug(`${COLORS.GRAY}[DEBUG][${this.moduleName}]${COLORS.RESET} ${message}`);
      if (data) console.debug(data);
    }
  }

  /**
   * Tạo một instance của logger
   * @param moduleName Tên module sử dụng logger
   * @returns Instance của logger
   */
  static getLogger(moduleName: string): Logger {
    return new Logger(moduleName);
  }

  /**
   * Thiết lập cấp độ log
   * @param level Cấp độ log mới
   */
  static setLogLevel(level: LogLevel): void {
    Logger.logLevel = level;
  }
} 