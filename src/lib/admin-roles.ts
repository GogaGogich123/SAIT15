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
  const { data, error } = await supabase.rpc('get_user_permissions', { user_id: userId });
  
  if (error) throw error;
  return data || [];
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
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      user_roles!inner(
        role:admin_roles(*)
      )
    `)
    .in('role', ['admin', 'super_admin'])
    .eq('user_roles.is_active', true);
  
  if (error) throw error;
  
  // Преобразуем данные
  const adminUsers: AdminUser[] = [];
  
  for (const user of data || []) {
    const roles = user.user_roles?.map((ur: any) => ur.role).filter(Boolean) || [];
    const permissions = await getUserPermissions(user.id);
    
    adminUsers.push({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roles,
      permissions,
      created_at: user.created_at
    });
  }
  
  return adminUsers;
};

// Создание нового администратора
export const createAdmin = async (adminData: {
  name: string;
  email: string;
  password: string;
  roleIds: string[];
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