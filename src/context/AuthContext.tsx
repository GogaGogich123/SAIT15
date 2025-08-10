import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
        } else if (session?.user) {
          // Try to get cadet data for authenticated user
          const { data: cadetData } = await supabase
            .from('cadets')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();

          if (cadetData) {
            setUser({
              id: session.user.id,
              name: cadetData.name,
              role: 'cadet',
              platoon: cadetData.platoon,
              squad: cadetData.squad,
              cadetId: cadetData.id
            });
          } else {
            // No cadet data found, clear session
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Try to get cadet data for authenticated user
          const { data: cadetData } = await supabase
            .from('cadets')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();

          if (cadetData) {
            setUser({
              id: session.user.id,
              name: cadetData.name,
              role: 'cadet',
              platoon: cadetData.platoon,
              squad: cadetData.squad,
              cadetId: cadetData.id
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Администратор Иванов И.И.',
        role: 'admin'
      });
      console.log('Admin user logged in successfully');
      return true;
    } else if (email === 'cadet@nkkk.ru' && password === 'cadet123') {
      setUser({
        id: '00000000-0000-0000-0000-000000000002',
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

  const isAdmin = user?.role === 'admin';

  // Show loading state while initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};