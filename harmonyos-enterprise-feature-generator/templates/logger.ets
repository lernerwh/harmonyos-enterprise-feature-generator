/**
 * 日志工具
 * 功能：分级日志、颜色输出、文件写入（可选）
 */

import { BusinessError } from '@kit.BasicServicesKit';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * 日志级别名称
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR'
};

/**
 * 日志级别颜色（控制台输出）
 */
const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m',  // 青色
  [LogLevel.INFO]: '\x1b[32m',   // 绿色
  [LogLevel.WARN]: '\x1b[33m',   // 黄色
  [LogLevel.ERROR]: '\x1b[31m'   // 红色
};

/**
 * 日志配置
 */
interface LoggerConfig {
  level: LogLevel;          // 最低日志级别
  enableConsole: boolean;   // 是否启用控制台输出
  enableFile: boolean;      // 是否启用文件输出
  enableTimestamp: boolean; // 是否显示时间戳
  enableModule: boolean;    // 是否显示模块名
  filePrefix?: string;      // 日志文件前缀
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  enableTimestamp: true,
  enableModule: true
};

/**
 * 全局配置
 */
let globalConfig: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * 日志条目
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  module: string;
  message: string;
  stack?: string;
}

/**
 * Logger 类
 */
export class Logger {
  private moduleName: string;
  private config: LoggerConfig;

  constructor(moduleName: string, config?: Partial<LoggerConfig>) {
    this.moduleName = moduleName;
    this.config = { ...globalConfig, ...config };
  }

  /**
   * 输出 DEBUG 级别日志
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * 输出 INFO 级别日志
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * 输出 WARN 级别日志
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * 输出 ERROR 级别日志
   */
  error(message: string, error?: Error | any, ...args: any[]): void {
    const logEntry = this.createLogEntry(LogLevel.ERROR, message, ...args);

    if (error) {
      if (error instanceof Error) {
        logEntry.stack = error.stack;
      } else {
        logEntry.stack = JSON.stringify(error);
      }
    }

    this.output(logEntry);
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.config.level) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, ...args);
    this.output(logEntry);
  }

  /**
   * 创建日志条目
   */
  private createLogEntry(level: LogLevel, message: string, ...args: any[]): LogEntry {
    const timestamp = this.config.enableTimestamp ? this.getTimestamp() : '';
    const levelName = LOG_LEVEL_NAMES[level];
    const module = this.config.enableModule ? `[${this.moduleName}]` : '';

    // 格式化参数
    let formattedMessage = message;
    if (args.length > 0) {
      try {
        formattedMessage += ' ' + args.map(arg => {
          if (typeof arg === 'object') {
            return JSON.stringify(arg);
          }
          return String(arg);
        }).join(' ');
      } catch (e) {
        formattedMessage += ' [无法格式化参数]';
      }
    }

    return {
      timestamp,
      level,
      levelName,
      module: this.moduleName,
      message: formattedMessage
    };
  }

  /**
   * 输出日志
   */
  private output(logEntry: LogEntry): void {
    // 控制台输出
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // 文件输出
    if (this.config.enableFile) {
      this.outputToFile(logEntry);
    }
  }

  /**
   * 输出到控制台
   */
  private outputToConsole(logEntry: LogEntry): void {
    const color = LOG_LEVEL_COLORS[logEntry.level];
    const reset = '\x1b[0m';

    const parts: string[] = [];

    if (logEntry.timestamp) {
      parts.push(`[${logEntry.timestamp}]`);
    }

    parts.push(`[${color}${logEntry.levelName}${reset}]`);

    if (logEntry.module) {
      parts.push(`[${logEntry.module}]`);
    }

    parts.push(logEntry.message);

    const logMessage = parts.join(' ');

    switch (logEntry.level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        if (logEntry.stack) {
          console.error(logEntry.stack);
        }
        break;
    }
  }

  /**
   * 输出到文件
   */
  private outputToFile(logEntry: LogEntry): void {
    // TODO: 实现文件写入逻辑
    // 由于 HarmonyOS 文件系统限制，需要使用 @ohos.fileio 模块
    // 这里仅做占位
  }

  /**
   * 获取时间戳
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * 配置全局日志设置
   */
  static configure(config: Partial<LoggerConfig>): void {
    globalConfig = { ...globalConfig, ...config };
  }

  /**
   * 获取全局配置
   */
  static getConfig(): LoggerConfig {
    return { ...globalConfig };
  }

  /**
   * 重置全局配置为默认值
   */
  static resetConfig(): void {
    globalConfig = { ...DEFAULT_CONFIG };
  }
}

/**
 * 使用示例：
 *
 * // 创建 Logger 实例
 * const logger = new Logger('MyModule');
 *
 * // 输出不同级别的日志
 * logger.debug('调试信息');
 * logger.info('普通信息');
 * logger.warn('警告信息');
 * logger.error('错误信息', error);
 *
 * // 配置全局日志设置
 * Logger.configure({
 *   level: LogLevel.DEBUG,
 *   enableConsole: true,
 *   enableFile: false
 * });
 */
