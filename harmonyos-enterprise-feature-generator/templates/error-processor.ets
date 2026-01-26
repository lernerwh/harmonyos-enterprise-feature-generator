/**
 * 错误处理工具
 * 功能：统一错误处理、分类、重试、友好提示
 */

import { promptAction } from '@kit.ArkUI';
import { Logger } from './logger';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'NETWORK',           // 网络错误
  PERMISSION = 'PERMISSION',     // 权限错误
  BUSINESS = 'BUSINESS',         // 业务错误
  SYSTEM = 'SYSTEM'              // 系统错误
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  code: number;
  type: ErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
}

/**
 * 错误码定义
 */
export const ErrorCode = {
  // 用户相关错误 (1xxx)
  USER_NOT_FOUND: 1001,
  USER_ALREADY_EXISTS: 1002,
  INVALID_CREDENTIALS: 1003,

  // 权限相关错误 (2xxx)
  PERMISSION_DENIED: 2001,
  UNAUTHORIZED: 2002,
  TOKEN_EXPIRED: 2003,
  INSUFFICIENT_PRIVILEGES: 2004,

  // 网络相关错误 (3xxx)
  NETWORK_ERROR: 3001,
  TIMEOUT: 3002,
  SERVER_ERROR: 3003,
  NOT_FOUND: 3004,

  // 业务相关错误 (4xxx)
  INVALID_PARAMETER: 4001,
  DATA_NOT_FOUND: 4002,
  OPERATION_FAILED: 4003,
  DUPLICATE_OPERATION: 4004,

  // 系统错误 (9xxx)
  UNKNOWN_ERROR: 9000,
  INTERNAL_ERROR: 9001
};

/**
 * 错误配置映射
 */
const ERROR_CONFIG: Record<number, ErrorInfo> = {
  [ErrorCode.USER_NOT_FOUND]: {
    code: ErrorCode.USER_NOT_FOUND,
    type: ErrorType.BUSINESS,
    message: '用户不存在',
    userMessage: '用户不存在，请检查后重试',
    canRetry: false
  },
  [ErrorCode.PERMISSION_DENIED]: {
    code: ErrorCode.PERMISSION_DENIED,
    type: ErrorType.PERMISSION,
    message: '无权限访问',
    userMessage: '您没有权限执行此操作',
    canRetry: false
  },
  [ErrorCode.UNAUTHORIZED]: {
    code: ErrorCode.UNAUTHORIZED,
    type: ErrorType.PERMISSION,
    message: '未授权',
    userMessage: '请先登录',
    canRetry: false
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    code: ErrorCode.TOKEN_EXPIRED,
    type: ErrorType.PERMISSION,
    message: 'Token 已过期',
    userMessage: '登录已过期，请重新登录',
    canRetry: false
  },
  [ErrorCode.NETWORK_ERROR]: {
    code: ErrorCode.NETWORK_ERROR,
    type: ErrorType.NETWORK,
    message: '网络错误',
    userMessage: '网络连接失败，请检查网络后重试',
    canRetry: true
  },
  [ErrorCode.TIMEOUT]: {
    code: ErrorCode.TIMEOUT,
    type: ErrorType.NETWORK,
    message: '请求超时',
    userMessage: '请求超时，请稍后重试',
    canRetry: true
  },
  [ErrorCode.SERVER_ERROR]: {
    code: ErrorCode.SERVER_ERROR,
    type: ErrorType.NETWORK,
    message: '服务器错误',
    userMessage: '服务器异常，请稍后重试',
    canRetry: true
  },
  [ErrorCode.INVALID_PARAMETER]: {
    code: ErrorCode.INVALID_PARAMETER,
    type: ErrorType.BUSINESS,
    message: '参数错误',
    userMessage: '参数不正确，请检查后重试',
    canRetry: false
  },
  [ErrorCode.DATA_NOT_FOUND]: {
    code: ErrorCode.DATA_NOT_FOUND,
    type: ErrorType.BUSINESS,
    message: '数据不存在',
    userMessage: '数据不存在，请刷新后重试',
    canRetry: true
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    code: ErrorCode.UNKNOWN_ERROR,
    type: ErrorType.SYSTEM,
    message: '未知错误',
    userMessage: '发生未知错误，请稍后重试',
    canRetry: true
  }
};

/**
 * 错误处理器
 */
export class ErrorProcessor {
  private static logger: Logger = new Logger('ErrorProcessor');
  private static maxRetries: number = 3;
  private static retryDelay: number = 1000;

  /**
   * 处理错误
   */
  static processError(error: Error | BusinessError | any, showPrompt: boolean = true): ErrorInfo {
    const errorInfo = this.parseError(error);

    this.logger.error(`[${errorInfo.type}] ${errorInfo.message}`, error);

    if (showPrompt) {
      this.showErrorPrompt(errorInfo);
    }

    // 特殊处理：权限错误，跳转登录页
    if (errorInfo.type === ErrorType.PERMISSION) {
      this.handlePermissionError(errorInfo);
    }

    return errorInfo;
  }

  /**
   * 显示错误码对应的错误信息
   */
  static showError(code: number, customMessage?: string): void {
    const errorInfo = ERROR_CONFIG[code] || ERROR_CONFIG[ErrorCode.UNKNOWN_ERROR];
    this.showErrorPrompt({
      ...errorInfo,
      userMessage: customMessage || errorInfo.userMessage
    });
  }

  /**
   * 解析错误
   */
  private static parseError(error: Error | BusinessError | any): ErrorInfo {
    // 如果是 BusinessError
    if (error.code !== undefined) {
      const code = error.code as number;
      return ERROR_CONFIG[code] || {
        code,
        type: ErrorType.SYSTEM,
        message: error.message || '未知错误',
        userMessage: error.message || '发生未知错误',
        canRetry: true
      };
    }

    // 如果是 Error
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // 网络错误
      if (message.includes('network') || message.includes('fetch')) {
        return ERROR_CONFIG[ErrorCode.NETWORK_ERROR];
      }

      // 超时错误
      if (message.includes('timeout')) {
        return ERROR_CONFIG[ErrorCode.TIMEOUT];
      }

      // 404 错误
      if (message.includes('404') || message.includes('not found')) {
        return ERROR_CONFIG[ErrorCode.NOT_FOUND];
      }

      // 500 错误
      if (message.includes('500') || message.includes('server error')) {
        return ERROR_CONFIG[ErrorCode.SERVER_ERROR];
      }
    }

    // 默认错误
    return ERROR_CONFIG[ErrorCode.UNKNOWN_ERROR];
  }

  /**
   * 显示错误提示
   */
  private static showErrorPrompt(errorInfo: ErrorInfo): void {
    promptAction.showToast({
      message: errorInfo.userMessage,
      duration: 3000,
      bottom: '50%'
    });
  }

  /**
   * 处理权限错误
   */
  private static handlePermissionError(errorInfo: ErrorInfo): void {
    // TODO: 跳转到登录页
    this.logger.warn('权限错误，需要重新登录');
  }

  /**
   * 重试机制
   */
  static async retry<T>(
    fn: () => Promise<T>,
    retries: number = ErrorProcessor.maxRetries
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        const errorInfo = this.parseError(error);

        if (!errorInfo.canRetry || i === retries - 1) {
          throw error;
        }

        this.logger.warn(`重试第 ${i + 1} 次`, error);
        await ErrorProcessor.sleep(ErrorProcessor.retryDelay * (i + 1));
      }
    }

    throw new Error('重试失败');
  }

  /**
   * 延迟函数
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 配置重试参数
   */
  static configureRetry(maxRetries: number, retryDelay: number): void {
    ErrorProcessor.maxRetries = maxRetries;
    ErrorProcessor.retryDelay = retryDelay;
  }
}

/**
 * 业务错误类
 */
export class BusinessError extends Error {
  code: number;
  type: ErrorType;

  constructor(code: number, message: string, type: ErrorType = ErrorType.BUSINESS) {
    super(message);
    this.code = code;
    this.type = type;
    this.name = 'BusinessError';
  }
}

/**
 * 使用示例：
 *
 * // 方式1：自动处理错误
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   ErrorProcessor.processError(error);
 * }
 *
 * // 方式2：显示特定错误码
 * ErrorProcessor.showError(ErrorCode.PERMISSION_DENIED, '您没有权限访问此功能');
 *
 * // 方式3：重试
 * const result = await ErrorProcessor.retry(() => someApiCall());
 *
 * // 方式4：抛出业务错误
 * throw new BusinessError(ErrorCode.INVALID_PARAMETER, '参数错误', ErrorType.BUSINESS);
 */
