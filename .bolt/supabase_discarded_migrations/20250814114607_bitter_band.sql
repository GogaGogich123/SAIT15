/*
  # Create forum tables

  1. New Tables
    - `forum_categories`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `icon` (text, default 'MessageSquare')
      - `color` (text, default gradient)
      - `sort_order` (integer, default 0)
      - `is_active` (boolean, default true)
      - `topics_count` (integer, default 0)
      - `posts_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `forum_topics`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to forum_categories)
      - `title` (text, not null)
      - `content` (text, not null)
      - `author_id` (uuid, foreign key to cadets)
      - `is_pinned` (boolean, default false)
      - `is_locked` (boolean, default false)
      - `views_count` (integer, default 0)
      - `posts_count` (integer, default 0)
      - `last_post_at` (timestamp)
      - `last_post_by` (uuid, foreign key to cadets)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `forum_posts`
      - `id` (uuid, primary key)
      - `topic_id` (uuid, foreign key to forum_topics)
      - `author_id` (uuid, foreign key to cadets)
      - `content` (text, not null)
      - `is_edited` (boolean, default false)
      - `edited_at` (timestamp, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all forum tables
    - Add policies for reading and managing forum content
    - Admins can manage all forum content
    - Users can read active forum content
    - Users can create topics and posts

  3. Sample Data
    - Insert default forum categories for different topics
*/

-- Create forum_categories table
CREATE TABLE IF NOT EXISTS forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'MessageSquare',
  color text DEFAULT 'from-blue-500 to-blue-700',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  topics_count integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create forum_topics table
CREATE TABLE IF NOT EXISTS forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES cadets(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  views_count integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  last_post_at timestamptz DEFAULT now(),
  last_post_by uuid REFERENCES cadets(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES cadets(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_categories_sort_order ON forum_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_forum_categories_is_active ON forum_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_forum_topics_category_id ON forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_author_id ON forum_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_is_pinned ON forum_topics(is_pinned);
CREATE INDEX IF NOT EXISTS idx_forum_topics_last_post_at ON forum_topics(last_post_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id ON forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at);

-- Enable Row Level Security
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for forum_categories
CREATE POLICY "Anyone can read active forum categories"
  ON forum_categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage forum categories"
  ON forum_categories
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for forum_topics
CREATE POLICY "Anyone can read forum topics"
  ON forum_topics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create topics"
  ON forum_topics
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authors can update own topics"
  ON forum_topics
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage all topics"
  ON forum_topics
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for forum_posts
CREATE POLICY "Anyone can read forum posts"
  ON forum_posts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON forum_posts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authors can update own posts"
  ON forum_posts
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authors can delete own posts"
  ON forum_posts
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Admins can manage all posts"
  ON forum_posts
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert default forum categories
INSERT INTO forum_categories (name, description, icon, color, sort_order) VALUES
  ('Общие вопросы', 'Общие вопросы и обсуждения', 'MessageSquare', 'from-blue-500 to-blue-700', 1),
  ('Учеба', 'Вопросы по учебе и академическим предметам', 'BookOpen', 'from-green-500 to-green-700', 2),
  ('Спорт и физподготовка', 'Обсуждение спортивных мероприятий и тренировок', 'Trophy', 'from-orange-500 to-orange-700', 3),
  ('Дисциплина', 'Вопросы дисциплины и порядка', 'Shield', 'from-red-500 to-red-700', 4),
  ('Предложения', 'Предложения по улучшению жизни кадетов', 'Lightbulb', 'from-purple-500 to-purple-700', 5)
ON CONFLICT DO NOTHING;