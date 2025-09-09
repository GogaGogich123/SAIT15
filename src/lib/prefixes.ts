import { supabase } from './supabase';

// Types
export interface CadetPrefix {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CadetAssignedPrefix {
  id: string;
  cadet_id: string;
  prefix_id: string;
  prefix?: CadetPrefix;
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
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

// Получение всех доступных префиксов
export const getCadetPrefixes = async (): Promise<CadetPrefix[]> => {
  const { data, error } = await supabase
    .from('cadet_prefixes')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('display_name', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

// Получение префиксов кадета
export const getCadetAssignedPrefixes = async (cadetId: string): Promise<CadetAssignedPrefix[]> => {
  const { data, error } = await supabase
    .from('cadet_assigned_prefixes')
    .select(`
      *,
      prefix:cadet_prefixes(*)
    `)
    .eq('cadet_id', cadetId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true, foreignTable: 'prefix' });
  
  if (error) throw error;
  return data || [];
};

// Назначение префикса кадету
export const assignPrefixToCadet = async (cadetId: string, prefixId: string): Promise<void> => {
  try {
    await callEdgeFunction('assign-prefix-to-cadet', { cadetId, prefixId });
  } catch (error) {
    console.error('Assign prefix failed', error);
    throw error;
  }
};

// Удаление префикса у кадета
export const removePrefixFromCadet = async (cadetId: string, prefixId: string): Promise<void> => {
  try {
    await callEdgeFunction('remove-prefix-from-cadet', { cadetId, prefixId }, 'DELETE');
  } catch (error) {
    console.error('Remove prefix failed', error);
    throw error;
  }
};

// Создание нового префикса (только для админов)
export const createCadetPrefix = async (prefixData: {
  name: string;
  display_name: string;
  description?: string;
  color: string;
  sort_order: number;
}): Promise<CadetPrefix> => {
  try {
    const result = await callEdgeFunction('create-cadet-prefix', prefixData);
    return result.prefix;
  } catch (error) {
    console.error('Create prefix failed', error);
    throw error;
  }
};

// Обновление префикса
export const updateCadetPrefix = async (prefixId: string, updates: Partial<CadetPrefix>): Promise<void> => {
  try {
    await callEdgeFunction('update-cadet-prefix', { prefixId, updates }, 'PUT');
  } catch (error) {
    console.error('Update prefix failed', error);
    throw error;
  }
};

// Удаление префикса
export const deleteCadetPrefix = async (prefixId: string): Promise<void> => {
  try {
    await callEdgeFunction('delete-cadet-prefix', { prefixId }, 'DELETE');
  } catch (error) {
    console.error('Delete prefix failed', error);
    throw error;
  }
};