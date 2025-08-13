import { supabase } from './supabase';

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

// Создание достижения
export const createAchievement = async (achievementData: {
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
}) => {
  try {
    const result = await callEdgeFunction('create-achievement', achievementData);
    return result.achievement;
  } catch (error) {
    console.error('Create achievement failed', error);
    throw error;
  }
};

// Обновление достижения
export const updateAchievement = async (achievementId: string, updates: {
  title?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
}) => {
  try {
    const result = await callEdgeFunction('update-achievement', { achievementId, updates }, 'PUT');
    return result.achievement;
  } catch (error) {
    console.error('Update achievement failed', error);
    throw error;
  }
};

// Удаление достижения
export const deleteAchievement = async (achievementId: string) => {
  try {
    const result = await callEdgeFunction('delete-achievement', { achievementId }, 'DELETE');
    return result;
  } catch (error) {
    console.error('Delete achievement failed', error);
    throw error;
  }
};

// Присуждение достижения кадету
export const awardAchievement = async (cadetId: string, achievementId: string) => {
  try {
    const result = await callEdgeFunction('award-achievement', { cadetId, achievementId });
    return result.award;
  } catch (error) {
    console.error('Award achievement failed', error);
    throw error;
  }
};