import { supabase } from './supabase';

export interface CreateCadetData {
  name: string;
  email: string;
  phone?: string;
  platoon: string;
  squad: number;
  password: string;
  avatar_url?: string;
}

export interface UpdateCadetData {
  name?: string;
  email?: string;
  phone?: string;
  platoon?: string;
  squad?: number;
  avatar_url?: string;
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
const callEdgeFunction = async (functionName: string, payload: any, method: string = 'POST') => {
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

// Создание нового кадета с учетной записью
export const createCadetWithAuth = async (cadetData: CreateCadetData) => {
  try {
    console.log('Creating cadet via Edge Function', { email: cadetData.email, name: cadetData.name });
    
    const result = await callEdgeFunction('create-cadet', cadetData);
    
    console.log('Cadet created successfully via Edge Function');
    return result.cadet;
  } catch (error) {
    console.error('Create cadet via Edge Function failed', error);
    throw error;
  }
};

// Обновление данных кадета
export const updateCadetData = async (cadetId: string, updates: UpdateCadetData) => {
  try {
    console.log('Updating cadet via Edge Function', { cadetId, updates });
    
    const result = await callEdgeFunction('update-cadet', { cadetId, updates }, 'PUT');
    
    console.log('Cadet updated successfully via Edge Function');
    return result.cadet;

  } catch (error) {
    console.error('Update cadet via Edge Function failed', error);
    throw error;
  }
};

// Удаление кадета (с учетной записью)
export const deleteCadet = async (cadetId: string) => {
  try {
    console.log('Deleting cadet via Edge Function', { cadetId });
    
    const result = await callEdgeFunction('delete-cadet', { cadetId }, 'DELETE');
    
    console.log('Cadet deleted successfully via Edge Function');
    return result;

  } catch (error) {
    console.error('Delete cadet via Edge Function failed', error);
    throw error;
  }
};

// Получение статистики кадетов
export const getCadetsStats = async () => {
  try {
    const { data, error } = await supabase
      .from('cadets')
      .select('platoon, squad, total_score');

    if (error) {
      throw error;
    }

    const stats = {
      totalCadets: data.length,
      byPlatoon: {} as Record<string, number>,
      bySquad: {} as Record<string, number>,
      averageScore: 0
    };

    let totalScore = 0;

    data.forEach(cadet => {
      // По взводам
      stats.byPlatoon[cadet.platoon] = (stats.byPlatoon[cadet.platoon] || 0) + 1;
      
      // По отделениям
      const squadKey = `${cadet.platoon}-${cadet.squad}`;
      stats.bySquad[squadKey] = (stats.bySquad[squadKey] || 0) + 1;
      
      // Общий балл
      totalScore += cadet.total_score || 0;
    });

    stats.averageScore = data.length > 0 ? Math.round(totalScore / data.length) : 0;

    return stats;

  } catch (error) {
    console.error('Get cadets stats failed', error);
    throw error;
  }
};