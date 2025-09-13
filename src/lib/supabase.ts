import { createClient } from '@supabase/supabase-js';
import { cache } from './cache';
import { CACHE_KEYS, CACHE_DURATION } from '../utils/constants';
import { getRealAverageScore, getCategoryAverages } from './score-analytics';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Cadet {
  id: string;
  name: string;
  display_name?: string;
  platoon: string;
  squad: number;
  rank: number;
  total_score: number;
  avatar_url?: string;
  join_date: string;
}

export interface Score {
  id: string;
  cadet_id: string;
  study_score: number;
  discipline_score: number;
  events_score: number;
  category: 'study' | 'discipline' | 'events';
  points: number;
  description: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface CadetAchievement {
  id: string;
  cadet_id: string;
  achievement_id?: string;
  auto_achievement_id?: string;
  awarded_date: string;
  achievement?: Achievement;
  auto_achievement?: AutoAchievement;
}

export interface AutoAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement_type: 'total_score' | 'category_score';
  requirement_category?: 'study' | 'discipline' | 'events';
  requirement_value: number;
}

export interface ScoreHistory {
  id: string;
  cadet_id: string;
  category: 'study' | 'discipline' | 'events';
  points: number;
  description: string;
  created_at: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  is_main: boolean;
  background_image_url?: string;
  images?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'study' | 'discipline' | 'events';
  difficulty: 'easy' | 'medium' | 'hard';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  deadline: string;
  status: 'active' | 'inactive';
  max_participants: number;
  current_participants: number;
  abandon_penalty: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  cadet_id: string;
  submission_text: string;
  status: 'taken' | 'submitted' | 'completed' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_feedback?: string;
  created_at: string;
}

// Functions
export const getCadets = async (): Promise<Cadet[]> => {
  // Проверяем кэш
  const cached = cache.get<Cadet[]>(CACHE_KEYS.CADETS);
  if (cached) {
    return cached;
  }
  
  const { data, error } = await supabase
    .from('cadets')
    .select('*')
    .order('rank', { ascending: true });
  
  if (error) throw error;
  
  // Обрабатываем данные и добавляем последние изменения баллов
  const result = await Promise.all((data || []).map(async (cadet) => {
    // Получаем баллы кадета
    const { data: scores } = await supabase
      .from('scores')
      .select('study_score, discipline_score, events_score')
      .eq('cadet_id', cadet.id)
      .maybeSingle();

    // Получаем последнее изменение баллов
    const { data: lastScoreChange } = await supabase
      .from('score_history')
      .select('points, created_at')
      .eq('cadet_id', cadet.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      ...cadet,
      study_score: scores?.study_score || 0,
      discipline_score: scores?.discipline_score || 0,
      events_score: scores?.events_score || 0,
      last_score_change: lastScoreChange?.points || 0,
      last_score_change_date: lastScoreChange?.created_at || null
    };
  }));
  
  // Кэшируем результат
  cache.set(CACHE_KEYS.CADETS, result, CACHE_DURATION.MEDIUM);
  
  return result;
};

export const getCadetById = async (id: string): Promise<Cadet | null> => {
  const cacheKey = `${CACHE_KEYS.CADETS}_${id}`;
  const cached = cache.get<Cadet>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const { data, error } = await supabase
    .from('cadets')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  if (!data) return null;
  
  // Кэшируем результат
  cache.set(cacheKey, data, CACHE_DURATION.LONG);
  
  return data;
};

export const getCadetScores = async (cadetId: string): Promise<Score | null> => {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('cadet_id', cadetId)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  return data;
};

export const getCadetAchievements = async (cadetId: string): Promise<CadetAchievement[]> => {
  const { data, error } = await supabase
    .from('cadet_achievements')
    .select(`
      *,
      achievement:achievements(*),
      auto_achievement:auto_achievements(*)
    `)
    .eq('cadet_id', cadetId);
  
  if (error) throw error;
  
  return data || [];
};

export const getAutoAchievements = async (): Promise<AutoAchievement[]> => {
  const { data, error } = await supabase
    .from('auto_achievements')
    .select('*')
    .order('requirement_value', { ascending: true });
  
  if (error) throw error;
  
  return data || [];
};

export const getScoreHistory = async (cadetId: string): Promise<ScoreHistory[]> => {
  const { data, error } = await supabase
    .from('score_history')
    .select('*')
    .eq('cadet_id', cadetId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  
  return data || [];
};

export const getNews = async (): Promise<News[]> => {
  const cached = cache.get<News[]>(CACHE_KEYS.NEWS);
  if (cached) {
    return cached;
  }
  
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  const result = data || [];
  cache.set(CACHE_KEYS.NEWS, result, CACHE_DURATION.SHORT);
  
  return result;
};

export const getTasks = async (): Promise<Task[]> => {
  const cached = cache.get<Task[]>(CACHE_KEYS.TASKS);
  if (cached) {
    return cached;
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'active')
    .order('deadline', { ascending: true });
  
  if (error) throw error;
  
  const result = data || [];
  cache.set(CACHE_KEYS.TASKS, result, CACHE_DURATION.MEDIUM);
  
  return result;
};

export const getTaskSubmissions = async (cadetId: string): Promise<TaskSubmission[]> => {
  const { data, error } = await supabase
    .from('task_submissions')
    .select('*')
    .eq('cadet_id', cadetId);
  
  if (error) throw error;
  
  return data || [];
};

// Update functions
export const updateCadet = async (id: string, updates: Partial<Cadet>): Promise<void> => {
  const { error } = await supabase
    .from('cadets')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
  
  // Очищаем кэш кадетов
  cache.delete(CACHE_KEYS.CADETS);
  cache.delete(`${CACHE_KEYS.CADETS}_${id}`);
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
};

export const updateNews = async (id: string, updates: Partial<News>): Promise<void> => {
  console.log('Updating news in database:', id, updates);
  
  const { error } = await supabase
    .from('news')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) {
    console.error('Database error updating news:', error);
    throw error;
  }
  
  // Очищаем кэш новостей
  cache.delete(CACHE_KEYS.NEWS);
  console.log('News updated successfully');
};

export const addNews = async (newsData: Omit<News, 'id' | 'created_at' | 'updated_at'>): Promise<News> => {
  const { data, error } = await supabase
    .from('news')
    .insert([{
      title: newsData.title,
      content: newsData.content,
      author: newsData.author,
      is_main: newsData.is_main,
      background_image_url: newsData.background_image_url || null,
      images: newsData.images || []
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  // Очищаем кэш новостей
  cache.delete(CACHE_KEYS.NEWS);
  
  return data;
};

export const deleteNews = async (id: string): Promise<void> => {
  console.log('Deleting news from database:', id);
  
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Database error deleting news:', error);
    throw error;
  }
  
  // Очищаем кэш новостей
  cache.delete(CACHE_KEYS.NEWS);
  console.log('News deleted successfully');
};

// Achievements functions
export const getAchievements = async (): Promise<Achievement[]> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

// Score management functions
export const addScoreHistory = async (scoreData: Omit<ScoreHistory, 'id' | 'created_at'>): Promise<void> => {
  const { error } = await supabase
    .from('score_history')
    .insert([{
      cadet_id: scoreData.cadet_id,
      category: scoreData.category,
      points: scoreData.points,
      description: scoreData.description,
    }]);
  
  if (error) throw error;
};

// Analytics functions
export const getAnalytics = async () => {
  try {
    // Получаем данные из Supabase
    const [cadets, tasks, achievements, realAvgScore, categoryAverages] = await Promise.all([
      getCadets(),
      getTasks(),
      getAchievements(),
      getRealAverageScore(),
      getCategoryAverages()
    ]);
    
    // Группируем кадетов по взводам для статистики
    const platoonStats = cadets.reduce((acc: any[], cadet) => {
      const existing = acc.find(p => p.platoon === cadet.platoon);
      if (existing) {
        existing.total_score += cadet.total_score;
        existing.count += 1;
      } else {
        acc.push({
          platoon: cadet.platoon,
          total_score: cadet.total_score,
          count: 1
        });
      }
      return acc;
    }, []);
    
    // Вычисляем средний балл по взводам
    platoonStats.forEach(platoon => {
      platoon.avg_score = Math.round(platoon.total_score / platoon.count);
    });
  
    // Возвращаем аналитику на основе полученных данных
    return {
      totalCadets: cadets.length,
      totalTasks: tasks.length,
      totalAchievements: achievements.length,
      realAverageScore: realAvgScore,
      platoonStats,
      avgScores: [categoryAverages], // Реальные средние баллы по категориям
      topCadets: cadets.slice(0, 10).map(c => ({
        name: c.name,
        total_score: c.total_score,
        platoon: c.platoon
      }))
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    // Возвращаем базовые данные в случае ошибки
    return {
      totalCadets: 0,
      totalTasks: 0,
      totalAchievements: 0,
      realAverageScore: 0,
      platoonStats: [],
      avgScores: [{ study: 0, discipline: 0, events: 0 }],
      topCadets: []
    };
  }
};