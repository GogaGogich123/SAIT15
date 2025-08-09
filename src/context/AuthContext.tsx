import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  role: 'cadet' | 'admin';
  platoon?: string;
  squad?: number;
  cadetId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
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
        } else if (!cadetData) {
          // No cadet found for this auth user, fallback to mock login
          return mockLogin(email, password);
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
    if (email === 'admin@nkkk.ru' && password === 'admin123') {
      setUser({
        id: '1',
        name: 'Администратор Иванов И.И.',
        role: 'admin'
      });
      return true;
    } else if (email === 'cadet@nkkk.ru' && password === 'cadet123') {
      setUser({
        id: 'cadet1',
        name: 'Петров Алексей Владимирович',
        role: 'cadet',
        platoon: '10-1',
        squad: 2,
        cadetId: 'cadet1'
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    // Выход из Supabase Auth
    supabase.auth.signOut().catch(console.error);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};