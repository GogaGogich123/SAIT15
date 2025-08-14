import { supabase } from './supabase';

// Types
export interface AdminRole {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminPermission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  permission?: AdminPermission;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  role?: AdminRole;
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: AdminRole[];
  permissions: AdminPermission[];
  created_at: string;
}

// Функция для получения токена авторизации
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Пользователь не авторизован');
  }
  return session.access_token;
};

// Функция для вызова Edge Function
const callEdgeFunction = async (functionName: string, payload: any = {}, method: string = 'POST') => {
  const token = await getAuthToken();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// Получение всех ролей
export const getAdminRoles = async (): Promise<AdminRole[]> => {
  const { data, error } = await supabase
    .from('admin_roles')
    .select('*')
    .order('display_name', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

// Получение всех разрешений
export const getAdminPermissions = async (): Promise<AdminPermission[]> => {
  const { data, error } = await supabase
    .from('admin_permissions')
    .select('*')
    .order('category', { ascending: true })
    .order('display_name', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

// Получение разрешений для роли
export const getRolePermissions = async (roleId: string): Promise<AdminPermission[]> => {
  const { data, error } = await supabase
    .from('role_permissions')
    .select(`
      permission:admin_permissions(*)
    `)
    .eq('role_id', roleId);
  
  if (error) throw error;
  return data?.map(item => item.permission).filter(Boolean) || [];
};

// Получение ролей пользователя
export const getUserRoles = async (userId: string): Promise<AdminRole[]> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      role:admin_roles(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (error) throw error;
  return data?.map(item => item.role).filter(Boolean) || [];
};

// Получение разрешений пользователя
export const getUserPermissions = async (userId: string): Promise<AdminPermission[]> => {
  try {
    // Получаем прямые разрешения пользователя
    const { data: directPermissions, error: directError } = await supabase
      .from('user_permissions')
      .select(`
        permission:admin_permissions(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (directError) {
      console.error('Error fetching direct permissions:', directError);
    }

    // Получаем разрешения через роли
    const { data: rolePermissions, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        role:admin_roles!inner(
          role_permissions(
            permission:admin_permissions(*)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (roleError) {
      console.error('Error fetching role permissions:', roleError);
    }

    // Объединяем все разрешения
    const allPermissions: AdminPermission[] = [];
    
    // Добавляем прямые разрешения
    if (directPermissions) {
      directPermissions.forEach(item => {
        if (item.permission) {
          allPermissions.push(item.permission);
        }
      });
    }

    // Добавляем разрешения от ролей
    if (rolePermissions) {
      rolePermissions.forEach(userRole => {
        if (userRole.role?.role_permissions) {
          userRole.role.role_permissions.forEach((rp: any) => {
            if (rp.permission) {
              allPermissions.push(rp.permission);
            }
          });
        }
      });
    }

    // Удаляем дубликаты по ID
    const uniquePermissions = allPermissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    );

    return uniquePermissions;
  } catch (error) {
    console.error('Error in getUserPermissions:', error);
    return [];
  }
};

// Обновление разрешений администратора
export const updateAdminPermissions = async (userId: string, permissionIds: string[]): Promise<void> => {
  try {
    await callEdgeFunction('update-admin-permissions', { userId, permissionIds }, 'PUT');
  } catch (error) {
    console.error('Update admin permissions failed', error);
    throw error;
  }
};

// Получение прямых разрешений пользователя (не через роли)
export const getUserDirectPermissions = async (userId: string): Promise<AdminPermission[]> => {
  const { data, error } = await supabase
    .from('user_permissions')
    .select(`
      permission:admin_permissions(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (error) throw error;
  return data?.map(item => item.permission).filter(Boolean) || [];
};

// Проверка разрешения пользователя
export const checkUserPermission = async (userId: string, permissionName: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('user_has_permission', { 
    user_id: userId, 
    permission_name: permissionName 
  });
  
  if (error) throw error;
  return data || false;
};

// Получение всех администраторов с их ролями
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const result = await callEdgeFunction('get-all-admins', {}, 'GET');
    return result.admins;
  } catch (error) {
    console.error('Get admin users failed', error);
    throw error;
  }
};

// Создание нового администратора
export const createAdmin = async (adminData: {
  name: string;
  email: string;
  password: string;
  roleIds: string[];
  permissionIds?: string[];
}): Promise<AdminUser> => {
  try {
    const result = await callEdgeFunction('create-admin', adminData);
    return result.admin;
  } catch (error) {
    console.error('Create admin failed', error);
    throw error;
  }
};

// Обновление ролей администратора
export const updateAdminRoles = async (userId: string, roleIds: string[]): Promise<void> => {
  try {
    await callEdgeFunction('update-admin-roles', { userId, roleIds }, 'PUT');
  } catch (error) {
    console.error('Update admin roles failed', error);
    throw error;
  }
};

// Деактивация администратора
export const deactivateAdmin = async (userId: string): Promise<void> => {
  try {
    await callEdgeFunction('deactivate-admin', { userId }, 'PUT');
  } catch (error) {
    console.error('Deactivate admin failed', error);
    throw error;
  }
};

// Создание новой роли
export const createRole = async (roleData: {
  name: string;
  display_name: string;
  description?: string;
  permissionIds: string[];
}): Promise<AdminRole> => {
  try {
    const result = await callEdgeFunction('create-role', roleData);
    return result.role;
  } catch (error) {
    console.error('Create role failed', error);
    throw error;
  }
};

// Обновление разрешений роли
export const updateRolePermissions = async (roleId: string, permissionIds: string[]): Promise<void> => {
  try {
    await callEdgeFunction('update-role-permissions', { roleId, permissionIds }, 'PUT');
  } catch (error) {
    console.error('Update role permissions failed', error);
    throw error;
  }
};

// Удаление роли (только не системные)
export const deleteRole = async (roleId: string): Promise<void> => {
  try {
    await callEdgeFunction('delete-role', { roleId }, 'DELETE');
  } catch (error) {
    console.error('Delete role failed', error);
    throw error;
  }
};

// Проверка, является ли пользователь главным админом
export const isSuperAdmin = async (userId: string): Promise<boolean> => {
  const roles = await getUserRoles(userId);
  return roles.some(role => role.name === 'super_admin');
};

// Получение категорий разрешений
export const getPermissionCategories = (): { [key: string]: string } => {
  return {
    cadets: 'Управление кадетами',
    scores: 'Управление баллами',
    achievements: 'Достижения',
    events: 'События',
    content: 'Контент',
    tasks: 'Задания',
    forum: 'Форум',
    system: 'Система'
  };
};