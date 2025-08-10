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

// Сброс баллов
export const resetScores = async () => {
  try {
    console.log('Resetting scores...');
    const result = await callEdgeFunction('reset-scores');
    console.log('Scores reset successfully');
    return result;
  } catch (error) {
    console.error('Reset scores failed', error);
    throw error;
  }
};

// Сброс достижений
export const resetAchievements = async () => {
  try {
    console.log('Resetting achievements...');
    const result = await callEdgeFunction('reset-achievements');
    console.log('Achievements reset successfully');
    return result;
  } catch (error) {
    console.error('Reset achievements failed', error);
    throw error;
  }
};

// Сброс новостей
export const resetNews = async () => {
  try {
    console.log('Resetting news...');
    const result = await callEdgeFunction('reset-news');
    console.log('News reset successfully');
    return result;
  } catch (error) {
    console.error('Reset news failed', error);
    throw error;
  }
};

// Сброс событий
export const resetEvents = async () => {
  try {
    console.log('Resetting events...');
    const result = await callEdgeFunction('reset-events');
    console.log('Events reset successfully');
    return result;
  } catch (error) {
    console.error('Reset events failed', error);
    throw error;
  }
};

// Сброс заданий
export const resetTasks = async () => {
  try {
    console.log('Resetting tasks...');
    const result = await callEdgeFunction('reset-tasks');
    console.log('Tasks reset successfully');
    return result;
  } catch (error) {
    console.error('Reset tasks failed', error);
    throw error;
  }
};

// Сброс форума
export const resetForum = async () => {
  try {
    console.log('Resetting forum...');
    const result = await callEdgeFunction('reset-forum');
    console.log('Forum reset successfully');
    return result;
  } catch (error) {
    console.error('Reset forum failed', error);
    throw error;
  }
};

// Полный сброс всех данных (включая пользователей из auth.users)
export const fullReset = async () => {
  try {
    console.log('Performing full reset...');
    const result = await callEdgeFunction('full-reset');
    console.log('Full reset completed successfully');
    return result;
  } catch (error) {
    console.error('Full reset failed', error);
    throw error;
  }
};

// Сброс всех кадетов
export const resetCadets = async () => {
  try {
    console.log('Resetting all cadets...');
    const result = await callEdgeFunction('reset-cadets');
    console.log('All cadets reset successfully');
    return result;
  } catch (error) {
    console.error('Reset cadets failed', error);
    throw error;
  }
};

// Сброс кадетов по взводу
export const resetCadetsByPlatoon = async (platoon: string) => {
  try {
    console.log('Resetting cadets by platoon...', platoon);
    const result = await callEdgeFunction('reset-cadets-by-platoon', { platoon });
    console.log('Cadets by platoon reset successfully');
    return result;
  } catch (error) {
    console.error('Reset cadets by platoon failed', error);
    throw error;
  }
};