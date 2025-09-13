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

// Создание новости
export const createNews = async (newsData: {
  title: string;
  content: string;
  author: string;
  is_main: boolean;
  background_image_url?: string;
  images?: string[];
}) => {
  try {
    const result = await callEdgeFunction('create-news', newsData);
    return result.news;
  } catch (error) {
    console.error('Create news failed', error);
    throw error;
  }
};

// Обновление новости
export const updateNewsAdmin = async (newsId: string, updates: {
  title?: string;
  content?: string;
  author?: string;
  is_main?: boolean;
  background_image_url?: string;
  images?: string[];
}) => {
  try {
    const result = await callEdgeFunction('update-news', { newsId, updates }, 'PUT');
    return result.news;
  } catch (error) {
    console.error('Update news failed', error);
    throw error;
  }
};

// Удаление новости
export const deleteNewsAdmin = async (newsId: string) => {
  try {
    const result = await callEdgeFunction('delete-news', { newsId }, 'DELETE');
    return result;
  } catch (error) {
    console.error('Delete news failed', error);
    throw error;
  }
};