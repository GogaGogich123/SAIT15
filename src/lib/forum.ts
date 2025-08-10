import { supabase } from './supabase';

// Types
export interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  topics_count?: number;
  posts_count?: number;
  last_topic?: {
    title: string;
    author_name: string;
    created_at: string;
  };
}

export interface ForumTopic {
  id: string;
  category_id: string;
  title: string;
  content: string;
  author_id: string;
  author?: {
    name: string;
    avatar_url?: string;
    platoon: string;
  };
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  posts_count: number;
  last_post_at: string;
  last_post_by?: string;
  last_post_author?: {
    name: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  topic_id: string;
  author_id: string;
  author?: {
    name: string;
    avatar_url?: string;
    platoon: string;
    squad: number;
  };
  content: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
}

// Forum functions
export const getForumCategories = async (): Promise<ForumCategory[]> => {
  const { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const getTopicsByCategory = async (categoryId: string): Promise<ForumTopic[]> => {
  const { data, error } = await supabase
    .from('forum_topics')
    .select(`
      *,
      author:cadets!forum_topics_author_id_fkey(name, avatar_url, platoon),
      last_post_author:cadets!forum_topics_last_post_by_fkey(name, avatar_url)
    `)
    .eq('category_id', categoryId)
    .order('is_pinned', { ascending: false })
    .order('last_post_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getTopicById = async (topicId: string): Promise<ForumTopic | null> => {
  const { data, error } = await supabase
    .from('forum_topics')
    .select(`
      *,
      author:cadets!forum_topics_author_id_fkey(name, avatar_url, platoon)
    `)
    .eq('id', topicId)
    .single();
  
  if (error) throw error;
  return data;
};

export const getPostsByTopic = async (topicId: string): Promise<ForumPost[]> => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      *,
      author:cadets!forum_posts_author_id_fkey(name, avatar_url, platoon, squad)
    `)
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const createTopic = async (categoryId: string, title: string, content: string, authorId: string): Promise<ForumTopic> => {
  const { data, error } = await supabase
    .from('forum_topics')
    .insert([{
      category_id: categoryId,
      title,
      content,
      author_id: authorId
    }])
    .select(`
      *,
      author:cadets!forum_topics_author_id_fkey(name, avatar_url, platoon)
    `)
    .single();
  
  if (error) throw error;
  return data;
};

export const createPost = async (topicId: string, content: string, authorId: string): Promise<ForumPost> => {
  const { data, error } = await supabase
    .from('forum_posts')
    .insert([{
      topic_id: topicId,
      content,
      author_id: authorId
    }])
    .select(`
      *,
      author:cadets!forum_posts_author_id_fkey(name, avatar_url, platoon, squad)
    `)
    .single();
  
  if (error) throw error;
  return data;
};

export const incrementTopicViews = async (topicId: string): Promise<void> => {
  // Увеличиваем счетчик просмотров
  const { error } = await supabase
    .from('forum_topics')
    .update({ 
      views_count: supabase.literal('views_count + 1')
    })
    .eq('id', topicId);
  
  if (error) throw error;
};

export const updatePost = async (postId: string, content: string): Promise<void> => {
  const { error } = await supabase
    .from('forum_posts')
    .update({
      content,
      is_edited: true,
      edited_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', postId);
  
  if (error) throw error;
};

export const deletePost = async (postId: string): Promise<void> => {
  const { error } = await supabase
    .from('forum_posts')
    .delete()
    .eq('id', postId);
  
  if (error) throw error;
};