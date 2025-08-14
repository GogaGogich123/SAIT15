import { supabase } from './supabase';
import { cache } from './cache';
import { CACHE_KEYS, CACHE_DURATION } from '../utils/constants';

// Types
export interface Event {
  id: string;
  title: string;
  description: string;
  content?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  max_participants?: number;
  registration_deadline?: string;
  images: string[];
  background_image_url?: string;
  category: string;
  status: 'active' | 'cancelled' | 'completed';
  participants_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  cadet_id: string;
  cadet?: {
    name: string;
    avatar_url?: string;
    platoon: string;
    squad: number;
    email: string;
    phone?: string;
  };
  registration_date: string;
  status: 'registered' | 'confirmed' | 'cancelled';
  notes?: string;
}

// Events functions
export const getEvents = async (): Promise<Event[]> => {
  // Проверяем кэш
  const cached = cache.get<Event[]>(CACHE_KEYS.EVENTS);
  if (cached) {
    return cached;
  }
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .order('event_date', { ascending: true });
  
  if (error) throw error;
  
  const result = data || [];
  
  // Кэшируем результат
  cache.set(CACHE_KEYS.EVENTS, result, CACHE_DURATION.MEDIUM);
  
  return result;
};

export const getEventById = async (eventId: string): Promise<Event | null> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  
  if (error) throw error;
  return data;
};

export const getEventParticipants = async (eventId: string): Promise<EventParticipant[]> => {
  const { data, error } = await supabase
    .from('event_participants')
    .select(`
      *,
      cadet:cadets!event_participants_cadet_id_fkey(name, avatar_url, platoon, squad, email, phone)
    `)
    .eq('event_id', eventId)
    .order('registration_date', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const getCadetEventParticipations = async (cadetId: string): Promise<EventParticipant[]> => {
  const { data, error } = await supabase
    .from('event_participants')
    .select(`
      *,
      event:events!event_participants_event_id_fkey(title, event_date, location, status)
    `)
    .eq('cadet_id', cadetId)
    .order('registration_date', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const registerForEvent = async (eventId: string, cadetId: string, notes?: string): Promise<void> => {
  const { error } = await supabase
    .from('event_participants')
    .insert([{
      event_id: eventId,
      cadet_id: cadetId,
      notes: notes || null
    }]);
  
  if (error) throw error;
  
  // Очищаем кэш событий для получения актуальных данных
  cache.delete(CACHE_KEYS.EVENTS);
};

export const cancelEventRegistration = async (eventId: string, cadetId: string): Promise<void> => {
  const { error } = await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('cadet_id', cadetId);
  
  if (error) throw error;
  
  // Очищаем кэш событий для получения актуальных данных
  cache.delete(CACHE_KEYS.EVENTS);
};

export const isRegisteredForEvent = async (eventId: string, cadetId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('event_participants')
    .select('id')
    .eq('event_id', eventId)
    .eq('cadet_id', cadetId)
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
};

// Admin functions
export const createEvent = async (eventData: Omit<Event, 'id' | 'participants_count' | 'created_at' | 'updated_at'>): Promise<Event> => {
  const { data, error } = await supabase
    .from('events')
    .insert([{
      title: eventData.title,
      description: eventData.description,
      content: eventData.content,
      event_date: eventData.event_date,
      event_time: eventData.event_time,
      location: eventData.location,
      max_participants: eventData.max_participants,
      registration_deadline: eventData.registration_deadline,
      images: eventData.images || [],
      background_image_url: eventData.background_image_url,
      category: eventData.category,
      status: eventData.status
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  // Очищаем кэш событий после создания
  cache.delete(CACHE_KEYS.EVENTS);
  return data;
};

export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<void> => {
  const { error } = await supabase
    .from('events')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId);
  
  if (error) throw error;
  
  // Очищаем кэш событий после обновления
  cache.delete(CACHE_KEYS.EVENTS);
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
  
  if (error) throw error;
  
  // Очищаем кэш событий после удаления
  cache.delete(CACHE_KEYS.EVENTS);
};

export const updateParticipantStatus = async (participantId: string, status: 'registered' | 'confirmed' | 'cancelled'): Promise<void> => {
  const { error } = await supabase
    .from('event_participants')
    .update({ status })
    .eq('id', participantId);
  
  if (error) throw error;
};