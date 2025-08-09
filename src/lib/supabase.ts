import { createClient } from '@supabase/supabase-js';

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
  is_active: boolean;
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
  const { data, error } = await supabase
    .from('cadets')
    .select('*')
    .order('rank', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const getCadetById = async (id: string): Promise<Cadet> => {
  const { data, error } = await supabase
    .from('cadets')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const getCadetScores = async (cadetId: string): Promise<Score | null> => {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('cadet_id', cadetId)
    .single();
  
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
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data || [];
};

export const getNews = async (): Promise<News[]> => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'active')
    .order('deadline', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const getTaskSubmissions = async (cadetId: string): Promise<TaskSubmission[]> => {
  const { data, error } = await supabase
    .from('task_submissions')
    .select('*')
    .eq('cadet_id', cadetId);
  
  if (error) throw error;
  return data || [];
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

// Admin functions
export const addCadetByAdmin = async (cadetData: {
  name: string;
  email: string;
  password: string;
  platoon: string;
  squad: number;
  avatar_url?: string;
}): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('create-cadet', {
    body: cadetData
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Ошибка при создании кадета');
  }

  if (data?.error) {
    throw new Error(data.error);
  }
};