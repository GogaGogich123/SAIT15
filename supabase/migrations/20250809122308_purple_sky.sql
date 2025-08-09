/*
  # Создание форума и системы событий

  1. Новые таблицы
    - `forum_categories` - категории форума
    - `forum_topics` - темы форума
    - `forum_posts` - сообщения в темах
    - `events` - события/мероприятия
    - `event_participants` - участники событий

  2. Безопасность
    - Включение RLS для всех таблиц
    - Политики для чтения, создания и редактирования

  3. Функции
    - Автоматическое обновление счетчиков
    - Триггеры для обновления статистики
*/

-- Категории форума
CREATE TABLE IF NOT EXISTS forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'MessageSquare',
  color text DEFAULT 'from-blue-500 to-blue-700',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Темы форума
CREATE TABLE IF NOT EXISTS forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES forum_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES cadets(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  views_count integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  last_post_at timestamptz DEFAULT now(),
  last_post_by uuid REFERENCES cadets(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Сообщения в темах
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES forum_topics(id) ON DELETE CASCADE,
  author_id uuid REFERENCES cadets(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- События/мероприятия
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  content text,
  event_date date NOT NULL,
  event_time time,
  location text,
  max_participants integer,
  registration_deadline date,
  images jsonb DEFAULT '[]',
  background_image_url text,
  category text DEFAULT 'general',
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  participants_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Участники событий
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  cadet_id uuid REFERENCES cadets(id) ON DELETE CASCADE,
  registration_date timestamptz DEFAULT now(),
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled')),
  notes text,
  UNIQUE(event_id, cadet_id)
);

-- Включаем RLS
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Политики для категорий форума
CREATE POLICY "Everyone can read forum categories"
  ON forum_categories FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins can manage forum categories"
  ON forum_categories FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Политики для тем форума
CREATE POLICY "Everyone can read forum topics"
  ON forum_topics FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Cadets can create forum topics"
  ON forum_topics FOR INSERT
  TO authenticated
  WITH CHECK (author_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Authors can update own topics"
  ON forum_topics FOR UPDATE
  TO authenticated
  USING (author_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

-- Политики для сообщений форума
CREATE POLICY "Everyone can read forum posts"
  ON forum_posts FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Cadets can create forum posts"
  ON forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Authors can update own posts"
  ON forum_posts FOR UPDATE
  TO authenticated
  USING (author_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

-- Политики для событий
CREATE POLICY "Everyone can read active events"
  ON events FOR SELECT
  TO authenticated, anon
  USING (status = 'active');

CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Политики для участников событий
CREATE POLICY "Everyone can read event participants"
  ON event_participants FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Cadets can register for events"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (cadet_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Cadets can update own registrations"
  ON event_participants FOR UPDATE
  TO authenticated
  USING (cadet_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Cadets can cancel own registrations"
  ON event_participants FOR DELETE
  TO authenticated
  USING (cadet_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

-- Функция для обновления счетчика сообщений в теме
CREATE OR REPLACE FUNCTION update_topic_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_topics 
    SET 
      posts_count = posts_count + 1,
      last_post_at = NEW.created_at,
      last_post_by = NEW.author_id,
      updated_at = now()
    WHERE id = NEW.topic_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_topics 
    SET 
      posts_count = GREATEST(posts_count - 1, 0),
      updated_at = now()
    WHERE id = OLD.topic_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Функция для обновления счетчика участников события
CREATE OR REPLACE FUNCTION update_event_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET participants_count = participants_count + 1
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET participants_count = GREATEST(participants_count - 1, 0)
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Функция для обновления счетчика просмотров темы
CREATE OR REPLACE FUNCTION increment_topic_views(topic_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE forum_topics 
  SET views_count = views_count + 1
  WHERE id = topic_uuid;
END;
$$ LANGUAGE plpgsql;

-- Триггеры
CREATE TRIGGER update_topic_stats_trigger
  AFTER INSERT OR DELETE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_topic_stats();

CREATE TRIGGER update_event_participants_count_trigger
  AFTER INSERT OR DELETE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_event_participants_count();

-- Вставляем начальные категории форума
INSERT INTO forum_categories (name, description, icon, color, sort_order) VALUES
('Общие вопросы', 'Общие обсуждения и вопросы', 'MessageSquare', 'from-blue-500 to-blue-700', 1),
('Учёба', 'Обсуждение учебных вопросов', 'BookOpen', 'from-green-500 to-green-700', 2),
('Спорт и мероприятия', 'Спортивные события и мероприятия', 'Trophy', 'from-yellow-500 to-yellow-700', 3),
('Дисциплина', 'Вопросы дисциплины и порядка', 'Shield', 'from-red-500 to-red-700', 4),
('Предложения', 'Предложения по улучшению', 'Lightbulb', 'from-purple-500 to-purple-700', 5);