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

// Types
export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'study' | 'discipline' | 'events';
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
  status: 'taken' | 'submitted' | 'completed' | 'rejected' | 'abandoned';
  submission_text?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  feedback?: string;
  points_awarded: number;
  created_at: string;
  updated_at: string;
  task?: Task;
  cadet?: {
    name: string;
    avatar_url?: string;
    platoon: string;
    squad: number;
    email: string;
  };
}

// Task functions
export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'active')
    .eq('is_active', true)
    .order('deadline', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const getTaskById = async (taskId: string): Promise<Task | null> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();
  
  if (error) throw error;
  return data;
};

export const getTaskSubmissions = async (cadetId: string): Promise<TaskSubmission[]> => {
  const { data, error } = await supabase
    .from('task_submissions')
    .select(`
      *,
      task:tasks(*)
    `)
    .eq('cadet_id', cadetId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getTaskSubmissionsByTask = async (taskId: string): Promise<TaskSubmission[]> => {
  const { data, error } = await supabase
    .from('task_submissions')
    .select(`
      *,
      cadet:cadets!task_submissions_cadet_id_fkey(name, avatar_url, platoon, squad, email)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const getAllTaskSubmissions = async (): Promise<TaskSubmission[]> => {
  const { data, error } = await supabase
    .from('task_submissions')
    .select(`
      *,
      task:tasks(*),
      cadet:cadets!task_submissions_cadet_id_fkey(name, avatar_url, platoon, squad, email)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const takeTask = async (taskId: string, cadetId: string): Promise<void> => {
  // Проверяем, не превышен ли лимит участников
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Задание не найдено');
  
  if (task.max_participants > 0 && task.current_participants >= task.max_participants) {
    throw new Error('Достигнуто максимальное количество участников');
  }

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
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('task_id', taskId)
    .eq('cadet_id', cadetId);
  
  if (error) throw error;
};

export const abandonTask = async (taskId: string, cadetId: string): Promise<void> => {
  const { error } = await supabase
    .from('task_submissions')
    .update({
      status: 'abandoned',
      updated_at: new Date().toISOString()
    })
    .eq('task_id', taskId)
    .eq('cadet_id', cadetId);
  
  if (error) throw error;
};

export const isTaskTaken = async (taskId: string, cadetId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('task_submissions')
    .select('id')
    .eq('task_id', taskId)
    .eq('cadet_id', cadetId)
    .in('status', ['taken', 'submitted'])
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
};

// Admin functions
export const createTask = async (taskData: Omit<Task, 'id' | 'current_participants' | 'created_at' | 'updated_at'>): Promise<Task> => {
  try {
    const result = await callEdgeFunction('create-task', taskData);
    return result.task;
  } catch (error) {
    console.error('Create task failed', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  try {
    await callEdgeFunction('update-task', { taskId, updates }, 'PUT');
  } catch (error) {
    console.error('Update task failed', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  
  if (error) throw error;
};

export const reviewTaskSubmission = async (
  submissionId: string, 
  status: 'completed' | 'rejected', 
  feedback: string,
  pointsAwarded: number = 0,
  reviewerId: string
): Promise<void> => {
  const { error } = await supabase
    .from('task_submissions')
    .update({
      status,
      feedback,
      points_awarded: pointsAwarded,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId);
  
  if (error) throw error;
};