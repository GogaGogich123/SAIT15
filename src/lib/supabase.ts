import { createClient } from '@supabase/supabase-js';
import { cache } from './cache';
import { CACHE_KEYS, CACHE_DURATION } from '../utils/constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Cadet {
  id: string;
  name: string;
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
  points: number;
  deadline: string;
  status: string;
  created_at: string;
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
  
  const result = data || [];
  // Кэшируем результат
  cache.set(CACHE_KEYS.CADETS, result, CACHE_DURATION.MEDIUM);
  
  return result;
};

export const getCadetById = async (id: string): Promise<Cadet> => {
  const cacheKey = `${CACHE_KEYS.CADETS}_${id}`;
  const cached = cache.get<Cadet>(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const { data, error } = await supabase
      .from('cadets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      // Возвращаем моковые данные
      const mockCadets = getMockCadets();
      const mockCadet = mockCadets.find(c => c.id === id);
      if (!mockCadet) throw new Error('Cadet not found');
      return mockCadet;
    }
    
    // Кэшируем результат
    cache.set(cacheKey, data, CACHE_DURATION.LONG);
    
    return data;
  } catch (error) {
    console.error('Error fetching cadet:', error);
    const mockCadets = getMockCadets();
    const mockCadet = mockCadets.find(c => c.id === id);
    if (!mockCadet) throw new Error('Cadet not found');
    return mockCadet;
  }
};

export const getCadetScores = async (cadetId: string): Promise<Score | null> => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('cadet_id', cadetId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error);
      return getMockScore(cadetId);
    }
    
    return data || getMockScore(cadetId);
  } catch (error) {
    console.error('Error fetching scores:', error);
    return getMockScore(cadetId);
  }
};

const getMockScore = (cadetId: string): Score | null => {
  const mockScores: { [key: string]: Score } = {
    '1': {
      id: 'score-1',
      cadet_id: '1',
      study_score: 95,
      discipline_score: 88,
      events_score: 92,
      category: 'study',
      points: 0,
      description: '',
      created_at: '2024-01-01'
    },
    '2': {
      id: 'score-2',
      cadet_id: '2',
      study_score: 92,
      discipline_score: 86,
      events_score: 90,
      category: 'study',
      points: 0,
      description: '',
      created_at: '2024-01-01'
    },
    '3': {
      id: 'score-3',
      cadet_id: '3',
      study_score: 88,
      discipline_score: 84,
      events_score: 83,
      category: 'study',
      points: 0,
      description: '',
      created_at: '2024-01-01'
    },
    '4': {
      id: 'score-4',
      cadet_id: '4',
      study_score: 85,
      discipline_score: 82,
      events_score: 75,
      category: 'study',
      points: 0,
      description: '',
      created_at: '2024-01-01'
    },
    '5': {
      id: 'score-5',
      cadet_id: '5',
      study_score: 82,
      discipline_score: 78,
      events_score: 78,
      category: 'study',
      points: 0,
      description: '',
      created_at: '2024-01-01'
    }
  };
  
  return mockScores[cadetId] || null;
};

export const getCadetAchievements = async (cadetId: string): Promise<CadetAchievement[]> => {
  try {
    const { data, error } = await supabase
      .from('cadet_achievements')
      .select(`
        *,
        achievement:achievements(*),
        auto_achievement:auto_achievements(*)
      `)
      .eq('cadet_id', cadetId);
    
    if (error) {
      console.error('Supabase error:', error);
      return getMockCadetAchievements(cadetId);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching cadet achievements:', error);
    return getMockCadetAchievements(cadetId);
  }
};

const getMockCadetAchievements = (cadetId: string): CadetAchievement[] => {
  if (cadetId === '1') {
    return [
      {
        id: 'ach-1',
        cadet_id: '1',
        auto_achievement_id: 'auto-1',
        awarded_date: '2024-01-15',
        auto_achievement: {
          id: 'auto-1',
          title: 'Первые шаги',
          description: 'Набрать 50 баллов',
          icon: 'Zap',
          color: 'from-green-500 to-green-700',
          requirement_type: 'total_score',
          requirement_value: 50
        }
      }
    ];
  }
  return [];
};

export const getAutoAchievements = async (): Promise<AutoAchievement[]> => {
  try {
    const { data, error } = await supabase
      .from('auto_achievements')
      .select('*')
      .order('requirement_value', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      return getMockAutoAchievements();
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching auto achievements:', error);
    return getMockAutoAchievements();
  }
};

const getMockAutoAchievements = (): AutoAchievement[] => {
  return [
    {
      id: 'auto-1',
      title: 'Первые шаги',
      description: 'Набрать 50 баллов',
      icon: 'Zap',
      color: 'from-green-500 to-green-700',
      requirement_type: 'total_score',
      requirement_value: 50
    },
    {
      id: 'auto-2',
      title: 'На пути к успеху',
      description: 'Набрать 100 баллов',
      icon: 'Target',
      color: 'from-blue-500 to-blue-700',
      requirement_type: 'total_score',
      requirement_value: 100
    },
    {
      id: 'auto-3',
      title: 'Отличник',
      description: 'Набрать 200 баллов',
      icon: 'Trophy',
      color: 'from-yellow-500 to-yellow-700',
      requirement_type: 'total_score',
      requirement_value: 200
    },
    {
      id: 'auto-4',
      title: 'Мастер учёбы',
      description: 'Набрать 80 баллов по учёбе',
      icon: 'BookOpen',
      color: 'from-blue-500 to-blue-700',
      requirement_type: 'category_score',
      requirement_category: 'study',
      requirement_value: 80
    },
    {
      id: 'auto-5',
      title: 'Дисциплинированный',
      description: 'Набрать 80 баллов по дисциплине',
      icon: 'Shield',
      color: 'from-red-500 to-red-700',
      requirement_type: 'category_score',
      requirement_category: 'discipline',
      requirement_value: 80
    }
  ];
};

export const getScoreHistory = async (cadetId: string): Promise<ScoreHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('score_history')
      .select('*')
      .eq('cadet_id', cadetId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Supabase error:', error);
      return getMockScoreHistory(cadetId);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching score history:', error);
    return getMockScoreHistory(cadetId);
  }
};

const getMockScoreHistory = (cadetId: string): ScoreHistory[] => {
  if (cadetId === '1') {
    return [
      {
        id: 'hist-1',
        cadet_id: '1',
        category: 'study',
        points: 5,
        description: 'Отличная работа на уроке истории',
        created_at: '2024-03-15T10:00:00Z'
      },
      {
        id: 'hist-2',
        cadet_id: '1',
        category: 'discipline',
        points: 3,
        description: 'Примерное поведение на построении',
        created_at: '2024-03-14T08:00:00Z'
      },
      {
        id: 'hist-3',
        cadet_id: '1',
        category: 'events',
        points: 8,
        description: 'Активное участие в спортивном мероприятии',
        created_at: '2024-03-13T16:00:00Z'
      }
    ];
  }
  return [];
};

export const getNews = async (): Promise<News[]> => {
  const cached = cache.get<News[]>(CACHE_KEYS.NEWS);
  if (cached) {
    return cached;
  }
  
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return getMockNews();
    }
    
    const result = data || [];
    cache.set(CACHE_KEYS.NEWS, result, CACHE_DURATION.SHORT);
    
    return result;
  } catch (error) {
    console.error('Error fetching news:', error);
    return getMockNews();
  }
};

const getMockNews = (): News[] => {
  const result = [
    {
      id: 'news-1',
      title: 'Победа в региональных соревнованиях',
      content: 'Кадеты нашего корпуса заняли первое место в региональных военно-спортивных соревнованиях. Команда показала отличную подготовку и слаженную работу.',
      author: 'Администрация НККК',
      is_main: true,
      background_image_url: 'https://images.pexels.com/photos/1263986/pexels-photo-1263986.jpeg?w=1200',
      images: ['https://images.pexels.com/photos/1263986/pexels-photo-1263986.jpeg?w=800'],
      created_at: '2024-03-15T12:00:00Z'
    },
    {
      id: 'news-2',
      title: 'День открытых дверей',
      content: 'В субботу состоится день открытых дверей для будущих кадетов и их родителей. Приглашаем всех желающих познакомиться с нашим корпусом.',
      author: 'Приёмная комиссия',
      is_main: false,
      background_image_url: 'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?w=800',
      images: ['https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?w=600'],
      created_at: '2024-03-14T10:00:00Z'
    },
    {
      id: 'news-3',
      title: 'Новые достижения кадетов',
      content: 'Поздравляем кадетов 10-го взвода с успешным завершением учебного модуля по истории казачества.',
      author: 'Преподавательский состав',
      is_main: false,
      background_image_url: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?w=800',
      images: [],
      created_at: '2024-03-13T14:00:00Z'
    }
  ];
  cache.set(CACHE_KEYS.NEWS, result, CACHE_DURATION.SHORT);
  
  return result;
};

export const getTasks = async (): Promise<Task[]> => {
  const cached = cache.get<Task[]>(CACHE_KEYS.TASKS);
  if (cached) {
    return cached;
  }
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'active')
      .order('deadline', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      return getMockTasks();
    }
    
    const result = data || [];
    cache.set(CACHE_KEYS.TASKS, result, CACHE_DURATION.MEDIUM);
    
    return result;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return getMockTasks();
  }
};

const getMockTasks = (): Task[] => {
  const result = [
    {
      id: 'task-1',
      title: 'Подготовить доклад по истории казачества',
      description: 'Подготовить и представить доклад на тему "История кубанского казачества" объёмом не менее 5 страниц.',
      category: 'study' as const,
      difficulty: 'medium' as const,
      points: 15,
      deadline: '2024-12-31T23:59:59Z',
      status: 'active',
      created_at: '2024-03-01T10:00:00Z'
    },
    {
      id: 'task-2',
      title: 'Участие в утренней зарядке',
      description: 'Принять участие в утренней зарядке в течение недели без пропусков.',
      category: 'discipline' as const,
      difficulty: 'easy' as const,
      points: 10,
      deadline: '2024-12-25T23:59:59Z',
      status: 'active',
      created_at: '2024-03-01T10:00:00Z'
    },
    {
      id: 'task-3',
      title: 'Организация мероприятия для младших кадетов',
      description: 'Организовать и провести познавательное мероприятие для кадетов младших курсов.',
      category: 'events' as const,
      difficulty: 'hard' as const,
      points: 25,
      deadline: '2024-12-30T23:59:59Z',
      status: 'active',
      created_at: '2024-03-01T10:00:00Z'
    }
  ];
  cache.set(CACHE_KEYS.TASKS, result, CACHE_DURATION.MEDIUM);
  
  return result;
};

export const getTaskSubmissions = async (cadetId: string): Promise<TaskSubmission[]> => {
  try {
    console.log('Fetching task submissions for cadet:', cadetId);
    const { data, error } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('cadet_id', cadetId);
    
    if (error) {
      console.error('Supabase error:', error);
      // Возвращаем пустой массив при ошибке, чтобы не блокировать отображение заданий
      return [];
    }
    
    console.log('Task submissions data:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching task submissions:', error);
    return [];
  }
};

export const takeTask = async (taskId: string, cadetId: string): Promise<void> => {
  const { error } = await supabase
    .from('task_submissions')
    .insert({
      task_id: taskId,
      cadet_id: cadetId,
      status: 'taken',
      submission_text: ''
    });
  
  if (error) throw error;
};

export const submitTask = async (taskId: string, cadetId: string, submissionText: string): Promise<void> => {
  const { error } = await supabase
    .from('task_submissions')
    .update({
      submission_text: submissionText,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('task_id', taskId)
    .eq('cadet_id', cadetId);
  
  if (error) throw error;
};

export const abandonTask = async (taskId: string, cadetId: string): Promise<void> => {
  const { error } = await supabase
    .from('task_submissions')
    .delete()
    .eq('task_id', taskId)
    .eq('cadet_id', cadetId)
    .eq('status', 'taken');
  
  if (error) throw error;
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
  const { error } = await supabase
    .from('news')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
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
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Очищаем кэш новостей
  cache.delete(CACHE_KEYS.NEWS);
};

// Achievements functions
export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return getMockAchievements();
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return getMockAchievements();
  }
};

const getMockAchievements = (): Achievement[] => {
  return [
    {
      id: 'ach-1',
      title: 'Отличник учёбы',
      description: 'За выдающиеся успехи в учебной деятельности',
      icon: 'Star',
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 'ach-2',
      title: 'Лидер взвода',
      description: 'За проявленные лидерские качества',
      icon: 'Crown',
      color: 'from-yellow-500 to-yellow-700'
    },
    {
      id: 'ach-3',
      title: 'Активист корпуса',
      description: 'За активное участие в мероприятиях',
      icon: 'Users',
      color: 'from-green-500 to-green-700'
    }
  ];
};

export const addAchievement = async (achievementData: Omit<Achievement, 'id' | 'created_at'>): Promise<Achievement> => {
  const { data, error } = await supabase
    .from('achievements')
    .insert([{
      title: achievementData.title,
      description: achievementData.description,
      category: achievementData.category,
      icon: achievementData.icon,
      color: achievementData.color
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateAchievement = async (id: string, updates: Partial<Achievement>): Promise<void> => {
  const { error } = await supabase
    .from('achievements')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
};

export const deleteAchievement = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('achievements')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const awardAchievement = async (cadetId: string, achievementId: string, awardedBy: string): Promise<void> => {
  const { error } = await supabase
    .from('cadet_achievements')
    .insert([{
      cadet_id: cadetId,
      achievement_id: achievementId,
      awarded_by: awardedBy,
      awarded_date: new Date().toISOString()
    }]);
  
  if (error) throw error;
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

export const updateCadetScores = async (cadetId: string, category: 'study' | 'discipline' | 'events', points: number): Promise<void> => {
  // Получаем текущие баллы
  const { data: currentScores, error: fetchError } = await supabase
    .from('scores')
    .select('*')
    .eq('cadet_id', cadetId)
    .maybeSingle();
  
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
  const newScores = {
    study_score: currentScores?.study_score || 0,
    discipline_score: currentScores?.discipline_score || 0,
    events_score: currentScores?.events_score || 0
  };
  
  newScores[`${category}_score`] = Math.max(0, (newScores[`${category}_score`] || 0) + points);
  const totalScore = newScores.study_score + newScores.discipline_score + newScores.events_score;
  
  if (currentScores) {
    // Обновляем существующие баллы
    const { error } = await supabase
      .from('scores')
      .update(newScores)
      .eq('cadet_id', cadetId);
    
    if (error) throw error;
  try {
    const { data, error } = await supabase
      .from('cadets')
      .select('*')
      .order('rank', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      // Возвращаем моковые данные при ошибке
      return getMockCadets();
    }
    
    const result = data || [];
    // Кэшируем результат
    cache.set(CACHE_KEYS.CADETS, result, CACHE_DURATION.MEDIUM);
    
    return result;
  } catch (error) {
    console.error('Error fetching cadets:', error);
    return getMockCadets();
  }
  } else {
    // Создаем новые баллы
    const { error } = await supabase
      .from('scores')
      .insert([{ cadet_id: cadetId, ...newScores }]);
    
    if (error) throw error;
  }
  
  // Обновляем общий счет кадета
  const { error: updateCadetError } = await supabase
    .from('cadets')
    .update({ 
      total_score: totalScore,
      updated_at: new Date().toISOString()
    })
    .eq('id', cadetId);
  
  if (updateCadetError) throw updateCadetError;
};

// Mock data functions for fallback
const getMockCadets = (): Cadet[] => {
  const result = [
    {
      id: '1',
      name: 'Петров Алексей Владимирович',
      platoon: '10-1',
      squad: 1,
      rank: 1,
      total_score: 275,
      avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200',
      join_date: '2023-09-01'
    },
    {
      id: '2',
      name: 'Сидоров Дмитрий Александрович',
      platoon: '10-1',
      squad: 1,
      rank: 2,
      total_score: 268,
      avatar_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=200',
      join_date: '2023-09-01'
    },
    {
      id: '3',
      name: 'Козлов Михаил Сергеевич',
      platoon: '10-2',
      squad: 2,
      rank: 3,
      total_score: 255,
      avatar_url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?w=200',
      join_date: '2023-09-01'
    },
    {
      id: '4',
      name: 'Волков Андрей Николаевич',
      platoon: '9-1',
      squad: 1,
      rank: 4,
      total_score: 242,
      avatar_url: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?w=200',
      join_date: '2023-09-01'
    },
    {
      id: '5',
      name: 'Морозов Владислав Игоревич',
      platoon: '9-2',
      squad: 2,
      rank: 5,
      total_score: 238,
      avatar_url: 'https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?w=200',
      join_date: '2023-09-01'
    }
  ];
  
  cache.set(CACHE_KEYS.CADETS, result, CACHE_DURATION.MEDIUM);
  
  return result;
};

// Analytics functions
export const getAnalytics = async () => {
  try {
    // Пытаемся получить данные из Supabase
    const cadets = await getCadets();
    const tasks = await getTasks();
    const achievements = await getAchievements();
    
    // Возвращаем аналитику на основе полученных данных
    return {
      totalCadets: cadets.length,
      totalTasks: tasks.length,
      totalAchievements: achievements.length,
      platoonStats: cadets.map(c => ({ platoon: c.platoon, total_score: c.total_score })),
      avgScores: [
        { study_score: 88, discipline_score: 84, events_score: 82 }
      ],
      topCadets: cadets.slice(0, 10).map(c => ({
        name: c.name,
        total_score: c.total_score,
        platoon: c.platoon
      }))
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    // Возвращаем моковые данные при ошибке
    return {
      totalCadets: 5,
      totalTasks: 3,
      totalAchievements: 3,
      platoonStats: [],
      avgScores: [
        { study_score: 88, discipline_score: 84, events_score: 82 }
      ],
      topCadets: []
    };
  }
};