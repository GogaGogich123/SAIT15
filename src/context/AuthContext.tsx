import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserRoles, getUserPermissions, type AdminRole, type AdminPermission } from '../lib/admin-roles';

interface User {
  id: string;
  name: string;
  role: 'cadet' | 'admin' | 'super_admin';
  platoon?: string;
  squad?: number;
  cadetId?: string;
  adminRoles?: AdminRole[];
  permissions?: AdminPermission[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permissionName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Попытка входа через Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        // Fallback на mock данные для демонстрации
        return mockLogin(email, password);
      }

      if (authData.user) {
        // Получаем данные пользователя из базы
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (!userError && userData) {
          let userObj: User = {
            id: authData.user.id,
            name: userData.name,
            role: userData.role
          };

          // Если это админ, получаем роли и разрешения
          if (userData.role === 'admin' || userData.role === 'super_admin') {
            try {
              const [adminRoles, permissions] = await Promise.all([
                getUserRoles(authData.user.id),
                getUserPermissions(authData.user.id)
              ]);
              userObj.adminRoles = adminRoles;
              userObj.permissions = permissions;
            } catch (roleError) {
              console.error('Error fetching admin roles/permissions:', roleError);
            }
          }

          setUser(userObj);
          return true;
        }

        // Получаем данные кадета из базы
        const { data: cadetData, error: cadetError } = await supabase
          .from('cadets')
          .select('*')
          .eq('auth_user_id', authData.user.id)
          .maybeSingle();

        if (!cadetError && cadetData) {
          setUser({
            id: authData.user.id,
            name: cadetData.name,
            role: 'cadet',
            platoon: cadetData.platoon,
            squad: cadetData.squad,
            cadetId: cadetData.id
          });
          return true;
        }
      }

      // If Supabase auth succeeded but no cadet data found, try mock login
      return mockLogin(email, password);
    } catch (error) {
      console.error('Login error:', error);
      return mockLogin(email, password);
    }
  };

  const mockLogin = (email: string, password: string): boolean => {
    if (email === 'superadmin@nkkk.ru' && password === 'superadmin123') {
      setUser({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Главный администратор',
        role: 'super_admin',
        adminRoles: [{
          id: '1',
          name: 'super_admin',
          display_name: 'Главный администратор',
          description: 'Полные права доступа',
          is_system_role: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        permissions: []
      });
      console.log('Super admin user logged in successfully');
      return true;
    } else if (email === 'admin@nkkk.ru' && password === 'admin123') {
      setUser({
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Администратор Иванов И.И.',
        role: 'admin',
        adminRoles: [{
          id: '2',
          name: 'admin',
          display_name: 'Администратор',
          description: 'Стандартные права администратора',
          is_system_role: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        permissions: []
      });
      console.log('Admin user logged in successfully');
      return true;
    } else if (email === 'cadet@nkkk.ru' && password === 'cadet123') {
      setUser({
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Петров Алексей Владимирович',
        role: 'cadet',
        platoon: '10-1',
        squad: 2,
        cadetId: '00000000-0000-0000-0000-000000000001'
      });
      console.log('Cadet user logged in successfully');
      return true;
    }
    console.log('Login failed for:', email);
    return false;
  };

  const logout = () => {
    // Выход из Supabase Auth
    supabase.auth.signOut().catch(console.error);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin' || 
    user?.adminRoles?.some(role => role.name === 'super_admin') || false;

  const hasPermission = (permissionName: string): boolean => {
    if (isSuperAdmin) return true; // Главный админ имеет все права
    return user?.permissions?.some(permission => permission.name === permissionName) || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isSuperAdmin, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};