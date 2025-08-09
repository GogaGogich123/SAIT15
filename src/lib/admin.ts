import { supabase } from './supabase';
import { handleSupabaseError, safeLog } from '../utils/errorHandler';

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

// Создание нового кадета с учетной записью
export const createCadetWithAuth = async (cadetData: CreateCadetData) => {
  try {
    safeLog('Creating cadet with auth', { email: cadetData.email, name: cadetData.name });

    // 1. Создаем пользователя в Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cadetData.email,
      password: cadetData.password,
      email_confirm: true,
      user_metadata: {
        name: cadetData.name,
        role: 'cadet'
      }
    });

    if (authError) {
      safeLog('Auth creation failed', authError);
      throw new Error(`Ошибка создания учетной записи: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Не удалось создать пользователя');
    }

    safeLog('Auth user created', { id: authData.user.id });

    try {
      // 2. Создаем запись в таблице users
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: cadetData.email,
          name: cadetData.name,
          role: 'cadet'
        }]);

      if (userError) {
        safeLog('User table insert failed', userError);
        // Не критично, если запись уже существует или создается триггером
      }

      // 3. Создаем запись кадета в таблице cadets
      const { data: cadetRecord, error: cadetError } = await supabase
        .from('cadets')
        .insert([{
          auth_user_id: authData.user.id,
          name: cadetData.name,
          email: cadetData.email,
          phone: cadetData.phone || null,
          platoon: cadetData.platoon,
          squad: cadetData.squad,
          avatar_url: cadetData.avatar_url || null,
          rank: 0,
          total_score: 0
        }])
        .select()
        .single();

      if (cadetError) {
        safeLog('Cadet creation failed', cadetError);
        
        // Если создание кадета не удалось, удаляем созданного пользователя
        await supabase.auth.admin.deleteUser(authData.user.id);
        
        throw new Error(`Ошибка создания профиля кадета: ${cadetError.message}`);
      }

      // 4. Создаем начальные баллы для кадета
      const { error: scoresError } = await supabase
        .from('scores')
        .insert([{
          cadet_id: cadetRecord.id,
          study_score: 0,
          discipline_score: 0,
          events_score: 0
        }]);

      if (scoresError) {
        safeLog('Initial scores creation failed', scoresError);
        // Не критично, можно продолжить
      }

      safeLog('Cadet created successfully', { cadetId: cadetRecord.id });
      return cadetRecord;

    } catch (error) {
      // Если что-то пошло не так после создания Auth пользователя, удаляем его
      safeLog('Cleaning up auth user due to error', error);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw error;
    }

  } catch (error) {
    safeLog('Create cadet with auth failed', error);
    throw error;
  }
};

// Обновление данных кадета
export const updateCadetData = async (cadetId: string, updates: UpdateCadetData) => {
  try {
    safeLog('Updating cadet', { cadetId, updates });

    const { data, error } = await supabase
      .from('cadets')
      .update(updates)
      .eq('id', cadetId)
      .select()
      .single();

    if (error) {
      safeLog('Cadet update failed', error);
      throw new Error(`Ошибка обновления кадета: ${error.message}`);
    }

    // Если обновляется email или имя, обновляем также в таблице users
    if (updates.email || updates.name) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          ...(updates.email && { email: updates.email }),
          ...(updates.name && { name: updates.name })
        })
        .eq('id', data.auth_user_id);

      if (userUpdateError) {
        safeLog('User table update failed', userUpdateError);
        // Не критично, продолжаем
      }
    }

    safeLog('Cadet updated successfully', { cadetId });
    return data;

  } catch (error) {
    safeLog('Update cadet failed', error);
    throw error;
  }
};

// Удаление кадета (с учетной записью)
export const deleteCadet = async (cadetId: string) => {
  try {
    safeLog('Deleting cadet', { cadetId });

    // Получаем auth_user_id перед удалением
    const { data: cadet, error: fetchError } = await supabase
      .from('cadets')
      .select('auth_user_id')
      .eq('id', cadetId)
      .single();

    if (fetchError) {
      throw new Error(`Ошибка получения данных кадета: ${fetchError.message}`);
    }

    // Удаляем кадета (каскадное удаление удалит связанные записи)
    const { error: deleteError } = await supabase
      .from('cadets')
      .delete()
      .eq('id', cadetId);

    if (deleteError) {
      throw new Error(`Ошибка удаления кадета: ${deleteError.message}`);
    }

    // Удаляем пользователя из Auth (если есть auth_user_id)
    if (cadet.auth_user_id) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(cadet.auth_user_id);
      
      if (authDeleteError) {
        safeLog('Auth user deletion failed', authDeleteError);
        // Не критично, кадет уже удален
      }
    }

    safeLog('Cadet deleted successfully', { cadetId });

  } catch (error) {
    safeLog('Delete cadet failed', error);
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
    safeLog('Get cadets stats failed', error);
    throw error;
  }
};