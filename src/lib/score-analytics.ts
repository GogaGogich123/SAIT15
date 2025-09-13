import { supabase } from './supabase';

// Функция для получения изменений баллов кадета за последний день
export const getCadetDailyScoreChange = async (cadetId: string): Promise<number> => {
  try {
    // Получаем все изменения баллов за последние 24 часа
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data, error } = await supabase
      .from('score_history')
      .select('points')
      .eq('cadet_id', cadetId)
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching daily score changes:', error);
      return 0;
    }
    
    // Суммируем все изменения за день
    const totalChange = (data || []).reduce((sum, entry) => sum + entry.points, 0);
    return totalChange;
  } catch (error) {
    console.error('Error calculating daily score change:', error);
    return 0;
  }
};

// Функция для получения изменений баллов для всех кадетов за день
export const getAllCadetsDailyChanges = async (): Promise<{ [cadetId: string]: number }> => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data, error } = await supabase
      .from('score_history')
      .select('cadet_id, points')
      .gte('created_at', yesterday.toISOString());
    
    if (error) {
      console.error('Error fetching all daily score changes:', error);
      return {};
    }
    
    // Группируем по кадетам и суммируем изменения
    const changes: { [cadetId: string]: number } = {};
    (data || []).forEach(entry => {
      if (!changes[entry.cadet_id]) {
        changes[entry.cadet_id] = 0;
      }
      changes[entry.cadet_id] += entry.points;
    });
    
    return changes;
  } catch (error) {
    console.error('Error calculating all daily score changes:', error);
    return {};
  }
};

// Функция для получения реального среднего балла
export const getRealAverageScore = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('cadets')
      .select('total_score');
    
    if (error) {
      console.error('Error fetching cadets for average score:', error);
      return 0;
    }
    
    if (!data || data.length === 0) {
      return 0;
    }
    
    const totalSum = data.reduce((sum, cadet) => sum + (cadet.total_score || 0), 0);
    return Math.round(totalSum / data.length);
  } catch (error) {
    console.error('Error calculating real average score:', error);
    return 0;
  }
};

// Функция для получения статистики по категориям баллов
export const getCategoryAverages = async (): Promise<{
  study: number;
  discipline: number;
  events: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('study_score, discipline_score, events_score');
    
    if (error) {
      console.error('Error fetching scores for category averages:', error);
      return { study: 0, discipline: 0, events: 0 };
    }
    
    if (!data || data.length === 0) {
      return { study: 0, discipline: 0, events: 0 };
    }
    
    const totals = data.reduce(
      (acc, score) => ({
        study: acc.study + (score.study_score || 0),
        discipline: acc.discipline + (score.discipline_score || 0),
        events: acc.events + (score.events_score || 0)
      }),
      { study: 0, discipline: 0, events: 0 }
    );
    
    return {
      study: Math.round(totals.study / data.length),
      discipline: Math.round(totals.discipline / data.length),
      events: Math.round(totals.events / data.length)
    };
  } catch (error) {
    console.error('Error calculating category averages:', error);
    return { study: 0, discipline: 0, events: 0 };
  }
};