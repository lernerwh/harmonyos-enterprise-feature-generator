/**
 * 服务基类模板
 * 功能：API 调用封装、数据缓存、错误处理
 */

import { Logger } from '../utils/logger';
import { ErrorProcessor } from '../utils/error-processor';
import { http } from '@kit.NetworkKit';

/**
 * API 响应基类
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 分页参数
 */
export interface PageParams {
  page: number;
  pageSize: number;
  search?: string;
}

/**
 * 分页响应
 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 服务基类
 */
export abstract class BaseService {
  protected logger: Logger;
  protected baseUrl: string;
  protected cache: Map<string, any> = new Map();
  protected cacheTimeout: number = 5 * 60 * 1000; // 5分钟缓存

  constructor(name: string, baseUrl: string) {
    this.logger = new Logger(name);
    this.baseUrl = baseUrl;
  }

  /**
   * 发起 HTTP 请求
   */
  protected async request<T>(
    method: http.RequestMethod,
    url: string,
    data?: object,
    headers?: Record<string, string>
  ): Promise<T> {
    try {
      this.logger.debug(`请求：${method} ${url}`);

      const request = http.createHttp();

      const response = await request.request(url, {
        method,
        header: {
          'Content-Type': 'application/json',
          ...headers
        },
        extraData: data,
        connectTimeout: 10000,
        readTimeout: 10000
      });

      if (response.responseCode !== 200) {
        throw new Error(`HTTP ${response.responseCode}`);
      }

      const result: ApiResponse<T> = JSON.parse(response.result as string);

      if (result.code !== 0) {
        throw new Error(result.message || '请求失败');
      }

      return result.data;

    } catch (error) {
      this.logger.error('请求失败', error);
      throw error;
    }
  }

  /**
   * GET 请求
   */
  protected async get<T>(url: string, params?: object): Promise<T> {
    const queryString = params ? this.objectToQueryString(params) : '';
    return this.request<T>(http.RequestMethod.GET, `${this.baseUrl}${url}${queryString}`);
  }

  /**
   * POST 请求
   */
  protected async post<T>(url: string, data?: object): Promise<T> {
    return this.request<T>(http.RequestMethod.POST, `${this.baseUrl}${url}`, data);
  }

  /**
   * PUT 请求
   */
  protected async put<T>(url: string, data?: object): Promise<T> {
    return this.request<T>(http.RequestMethod.PUT, `${this.baseUrl}${url}`, data);
  }

  /**
   * DELETE 请求
   */
  protected async delete<T>(url: string): Promise<T> {
    return this.request<T>(http.RequestMethod.DELETE, `${this.baseUrl}${url}`);
  }

  /**
   * 将对象转换为查询字符串
   */
  private objectToQueryString(obj: object): string {
    const params = Object.entries(obj)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return params ? `?${params}` : '';
  }

  /**
   * 设置缓存
   */
  protected setCache(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 获取缓存
   */
  protected getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * 清除缓存
   */
  protected clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 重试机制
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        this.logger.warn(`重试第 ${i + 1} 次`, error);

        if (i === maxRetries - 1) {
          throw error;
        }

        await this.sleep(delay * (i + 1));
      }
    }

    throw new Error('重试失败');
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 具体服务类示例
 */
export class {{ServiceName}} extends BaseService {
  private static instance: {{ServiceName}};

  private constructor() {
    super('{{ServiceName}}', 'https://api.example.com');
  }

  static getInstance(): {{ServiceName}} {
    if (!{{ServiceName}}.instance) {
      {{ServiceName}}.instance = new {{ServiceName}}();
    }
    return {{ServiceName}}.instance;
  }

  /**
   * 获取列表
   */
  async getList(params: PageParams): Promise<PageResponse<{{DataType}}>> {
    const cacheKey = `list_${JSON.stringify(params)}`;
    const cached = this.getCache<PageResponse<{{DataType}}>>(cacheKey);

    if (cached) {
      this.logger.debug('使用缓存数据');
      return cached;
    }

    try {
      const result = await this.get<PageResponse<{{DataType}}>>('/{{moduleName}}/list', params);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error('获取列表失败', error);
      throw error;
    }
  }

  /**
   * 获取详情
   */
  async getDetail(id: string): Promise<{{DataType}}> {
    const cacheKey = `detail_${id}`;
    const cached = this.getCache<{{DataType}}>(cacheKey);

    if (cached) {
      this.logger.debug('使用缓存数据');
      return cached;
    }

    try {
      const result = await this.get<{{DataType}}>(`/{{moduleName}}/detail/${id}`);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error('获取详情失败', error);
      throw error;
    }
  }

  /**
   * 创建
   */
  async create(data: Partial<{{DataType}}>): Promise<{{DataType}}> {
    try {
      const result = await this.post<{{DataType}}>(`/{{moduleName}}/create`, data);
      this.clearCache(); // 清除缓存
      return result;
    } catch (error) {
      this.logger.error('创建失败', error);
      throw error;
    }
  }

  /**
   * 更新
   */
  async update(id: string, data: Partial<{{DataType}}>): Promise<{{DataType}}> {
    try {
      const result = await this.put<{{DataType}}>(`/{{moduleName}}/update/${id}`, data);
      this.clearCache(); // 清除缓存
      return result;
    } catch (error) {
      this.logger.error('更新失败', error);
      throw error;
    }
  }

  /**
   * 删除
   */
  async delete(id: string): Promise<void> {
    try {
      await this.delete<void>(`/{{moduleName}}/delete/${id}`);
      this.clearCache(); // 清除缓存
    } catch (error) {
      this.logger.error('删除失败', error);
      throw error;
    }
  }
}
