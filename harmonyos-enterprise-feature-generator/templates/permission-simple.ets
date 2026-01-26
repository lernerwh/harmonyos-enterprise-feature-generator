/**
 * 简单权限管理模板
 * 功能：页面级权限检查
 */

import { Logger } from './logger';
import { ErrorProcessor } from './error-processor';

/**
 * 权限键枚举
 */
export enum SimplePermission {
  // 用户管理
  USER_MANAGEMENT = 'user_management',
  USER_LIST = 'user_list',
  USER_EDIT = 'user_edit',
  USER_DELETE = 'user_delete',

  // 审批流程
  APPROVAL_MANAGEMENT = 'approval_management',
  APPROVAL_SUBMIT = 'approval_submit',
  APPROVAL_APPROVE = 'approval_approve',

  // 数据报表
  REPORT_VIEW = 'report_view',
  REPORT_EXPORT = 'report_export',

  // 系统设置
  SETTINGS_VIEW = 'settings_view',
  SETTINGS_EDIT = 'settings_edit'
}

/**
 * 用户权限接口
 */
export interface UserPermission {
  userId: string;
  permissions: SimplePermission[];
}

/**
 * 简单权限检查类
 */
export class SimplePermissionCheck {
  private static logger: Logger = new Logger('SimplePermissionCheck');
  private static userPermissions: Map<string, SimplePermission[]> = new Map();

  /**
   * 初始化用户权限
   */
  static initialize(userPermissionsList: UserPermission[]): void {
    this.userPermissions.clear();
    userPermissionsList.forEach(item => {
      this.userPermissions.set(item.userId, item.permissions);
    });
    this.logger.info('权限初始化完成');
  }

  /**
   * 检查用户是否有指定权限
   */
  static hasPermission(userId: string, permission: SimplePermission): boolean {
    const permissions = this.userPermissions.get(userId);
    if (!permissions) {
      this.logger.warn(`用户 ${userId} 没有分配权限`);
      return false;
    }

    const hasPermission = permissions.includes(permission);
    if (!hasPermission) {
      this.logger.warn(`用户 ${userId} 没有权限 ${permission}`);
    }

    return hasPermission;
  }

  /**
   * 检查用户是否有任一权限
   */
  static hasAnyPermission(userId: string, permissions: SimplePermission[]): boolean {
    return permissions.some(permission => this.hasPermission(userId, permission));
  }

  /**
   * 检查权限（异步方法）
   */
  static async check(permission: SimplePermission): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();

      if (!userId) {
        this.logger.warn('无法获取当前用户 ID');
        return false;
      }

      return this.hasPermission(userId, permission);
    } catch (error) {
      this.logger.error('权限检查失败', error);
      return false;
    }
  }

  /**
   * 获取当前用户 ID
   */
  private static getCurrentUserId(): string {
    // TODO: 从会话或存储中获取当前用户 ID
    return '';
  }

  /**
   * 获取用户的所有权限
   */
  static getUserPermissions(userId: string): SimplePermission[] {
    return this.userPermissions.get(userId) || [];
  }

  /**
   * 添加权限到用户
   */
  static addPermission(userId: string, permission: SimplePermission): void {
    const permissions = this.userPermissions.get(userId) || [];
    if (!permissions.includes(permission)) {
      permissions.push(permission);
      this.userPermissions.set(userId, permissions);
      this.logger.info(`用户 ${userId} 添加权限 ${permission}`);
    }
  }

  /**
   * 从用户移除权限
   */
  static removePermission(userId: string, permission: SimplePermission): void {
    const permissions = this.userPermissions.get(userId);
    if (permissions) {
      const index = permissions.indexOf(permission);
      if (index > -1) {
        permissions.splice(index, 1);
        this.userPermissions.set(userId, permissions);
        this.logger.info(`用户 ${userId} 移除权限 ${permission}`);
      }
    }
  }
}

/**
 * 权限装饰器工厂
 */
export function RequirePermission(...permissions: SimplePermission[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = SimplePermissionCheck['getCurrentUserId']();

      if (!userId) {
        ErrorProcessor.showError(ErrorCode.UNAUTHORIZED);
        return;
      }

      if (!SimplePermissionCheck.hasAnyPermission(userId, permissions)) {
        ErrorProcessor.showError(ErrorCode.PERMISSION_DENIED);
        return;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 使用示例：
 *
 * // 1. 初始化权限
 * SimplePermissionCheck.initialize([
 *   {
 *     userId: 'user1',
 *     permissions: [SimplePermission.USER_MANAGEMENT, SimplePermission.USER_EDIT]
 *   },
 *   {
 *     userId: 'user2',
 *     permissions: [SimplePermission.USER_LIST]
 *   }
 * ]);
 *
 * // 2. 检查权限
 * const hasPermission = await SimplePermissionCheck.check(SimplePermission.USER_EDIT);
 * if (!hasPermission) {
 *   ErrorProcessor.showError(ErrorCode.PERMISSION_DENIED);
 *   return;
 * }
 *
 * // 3. 使用装饰器
 * class UserService {
 *   @RequirePermission(SimplePermission.USER_EDIT)
 *   async updateUser(userId: string, data: any) {
 *     // 只有有 USER_EDIT 权限的用户可以更新用户
 *   }
 * }
 */
