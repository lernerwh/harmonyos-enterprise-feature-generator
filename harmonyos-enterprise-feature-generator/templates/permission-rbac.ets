/**
 * RBAC 权限管理模板
 * 功能：基于角色的访问控制
 */

import { Logger } from './logger';
import { ErrorProcessor } from './error-processor';

/**
 * 角色枚举
 */
export enum Role {
  ADMIN = 'admin',           // 管理员
  MANAGER = 'manager',       // 经理
  USER = 'user',             // 普通用户
  GUEST = 'guest'            // 访客
}

/**
 * 权限枚举
 */
export enum Permission {
  // 用户管理
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',

  // 审批流程
  APPROVAL_VIEW = 'approval:view',
  APPROVAL_SUBMIT = 'approval:submit',
  APPROVAL_APPROVE = 'approval:approve',
  APPROVAL_REJECT = 'approval:reject',

  // 数据报表
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',

  // 系统设置
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit'
}

/**
 * 角色-权限映射
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // 管理员拥有所有权限
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_EDIT,
    Permission.USER_DELETE,
    Permission.APPROVAL_VIEW,
    Permission.APPROVAL_SUBMIT,
    Permission.APPROVAL_APPROVE,
    Permission.APPROVAL_REJECT,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT
  ],
  [Role.MANAGER]: [
    // 经理权限
    Permission.USER_VIEW,
    Permission.APPROVAL_VIEW,
    Permission.APPROVAL_APPROVE,
    Permission.APPROVAL_REJECT,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT
  ],
  [Role.USER]: [
    // 普通用户权限
    Permission.USER_VIEW,
    Permission.APPROVAL_VIEW,
    Permission.APPROVAL_SUBMIT,
    Permission.REPORT_VIEW
  ],
  [Role.GUEST]: [
    // 访客权限
    Permission.USER_VIEW,
    Permission.APPROVAL_VIEW
  ]
};

/**
 * 用户角色接口
 */
export interface UserRole {
  userId: string;
  roles: Role[];
}

/**
 * 权限检查类
 */
export class PermissionCheck {
  private static logger: Logger = new Logger('PermissionCheck');
  private static userRoles: Map<string, Role[]> = new Map();

  /**
   * 初始化用户角色
   */
  static initialize(userRolesList: UserRole[]): void {
    this.userRoles.clear();
    userRolesList.forEach(item => {
      this.userRoles.set(item.userId, item.roles);
    });
    this.logger.info('权限初始化完成');
  }

  /**
   * 检查用户是否有指定角色
   */
  static hasRole(userId: string, role: Role): boolean {
    const roles = this.userRoles.get(userId);
    return roles ? roles.includes(role) : false;
  }

  /**
   * 检查用户是否有任一角色
   */
  static hasAnyRole(userId: string, roles: Role[]): boolean {
    const userRoles = this.userRoles.get(userId);
    if (!userRoles) {
      return false;
    }
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * 检查用户是否有所有角色
   */
  static hasAllRoles(userId: string, roles: Role[]): boolean {
    const userRoles = this.userRoles.get(userId);
    if (!userRoles) {
      return false;
    }
    return roles.every(role => userRoles.includes(role));
  }

  /**
   * 检查用户是否有指定权限
   */
  static hasPermission(userId: string, permission: Permission): boolean {
    const roles = this.userRoles.get(userId);
    if (!roles || roles.length === 0) {
      this.logger.warn(`用户 ${userId} 没有分配角色`);
      return false;
    }

    // 检查用户的所有角色是否有该权限
    for (const role of roles) {
      const permissions = ROLE_PERMISSIONS[role];
      if (permissions && permissions.includes(permission)) {
        this.logger.debug(`用户 ${userId} (角色: ${role}) 有权限 ${permission}`);
        return true;
      }
    }

    this.logger.warn(`用户 ${userId} 没有权限 ${permission}`);
    return false;
  }

  /**
   * 检查用户是否有任一权限
   */
  static hasAnyPermission(userId: string, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userId, permission));
  }

  /**
   * 检查权限（异步方法，可从服务器获取）
   */
  static async check(permission: Permission): Promise<boolean> {
    try {
      // TODO: 从用户会话或服务器获取当前用户 ID
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
  static getUserPermissions(userId: string): Permission[] {
    const roles = this.userRoles.get(userId);
    if (!roles) {
      return [];
    }

    const permissions: Permission[] = [];
    roles.forEach(role => {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      permissions.push(...rolePermissions);
    });

    // 去重
    return Array.from(new Set(permissions));
  }

  /**
   * 获取用户的所有角色
   */
  static getUserRoles(userId: string): Role[] {
    return this.userRoles.get(userId) || [];
  }
}

/**
 * 权限装饰器工厂
 */
export function RequireRole(...roles: Role[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // TODO: 获取当前用户 ID
      const userId = PermissionCheck['getCurrentUserId']();

      if (!userId) {
        ErrorProcessor.showError(ErrorCode.UNAUTHORIZED);
        return;
      }

      if (!PermissionCheck.hasAnyRole(userId, roles)) {
        ErrorProcessor.showError(ErrorCode.PERMISSION_DENIED);
        return;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 权限装饰器工厂
 */
export function RequirePermission(...permissions: Permission[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // TODO: 获取当前用户 ID
      const userId = PermissionCheck['getCurrentUserId']();

      if (!userId) {
        ErrorProcessor.showError(ErrorCode.UNAUTHORIZED);
        return;
      }

      if (!PermissionCheck.hasAnyPermission(userId, permissions)) {
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
 * PermissionCheck.initialize([
 *   { userId: 'user1', roles: [Role.ADMIN] },
 *   { userId: 'user2', roles: [Role.USER] }
 * ]);
 *
 * // 2. 检查权限
 * const hasPermission = await PermissionCheck.check(Permission.USER_EDIT);
 * if (!hasPermission) {
 *   ErrorProcessor.showError(ErrorCode.PERMISSION_DENIED);
 *   return;
 * }
 *
 * // 3. 使用装饰器
 * class UserService {
 *   @RequireRole(Role.ADMIN, Role.MANAGER)
 *   async deleteUser(userId: string) {
 *     // 只有管理员和经理可以删除用户
 *   }
 *
 *   @RequirePermission(Permission.USER_EDIT)
 *   async updateUser(userId: string, data: any) {
 *     // 只有有 USER_EDIT 权限的用户可以更新用户
 *   }
 * }
 */
