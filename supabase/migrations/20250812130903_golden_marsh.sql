/*
  # Добавление голосования в форум и админских функций

  1. Новые таблицы
    - `topic_votes` - голоса за темы форума
      - `id` (uuid, primary key)
      - `topic_id` (uuid, foreign key to forum_topics)
      - `cadet_id` (uuid, foreign key to cadets)
      - `created_at` (timestamp)

  2. Изменения в существующих таблицах
    - `forum_topics` - добавлены поля для голосования
      - `votes_count` (integer, default 0)
      - `voting_enabled` (boolean, default false)

  3. Безопасность
    - Включен RLS для новой таблицы topic_votes
    - Добавлены политики для голосования
    - Добавлена политика для удаления сообщений админами
*/

-- Добавляем поля для голосования в таблицу forum_topics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forum_topics' AND column_name = 'votes_count'
  ) THEN
    ALTER TABLE forum_topics ADD COLUMN votes_count integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forum_topics' AND column_name = 'voting_enabled'
  ) THEN
    ALTER TABLE forum_topics ADD COLUMN voting_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Создаем таблицу для голосов
CREATE TABLE IF NOT EXISTS topic_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  cadet_id uuid NOT NULL REFERENCES cadets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(topic_id, cadet_id)
);

-- Включаем RLS для таблицы topic_votes
ALTER TABLE topic_votes ENABLE ROW LEVEL SECURITY;

-- Политики для topic_votes
CREATE POLICY "Cadets can vote on topics"
  ON topic_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (cadet_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Everyone can read topic votes"
  ON topic_votes
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Cadets can delete own votes"
  ON topic_votes
  FOR DELETE
  TO authenticated
  USING (cadet_id IN (
    SELECT id FROM cadets WHERE auth_user_id = auth.uid()
  ));

-- Добавляем политику для админов на удаление сообщений форума
CREATE POLICY "Allow admins to delete forum posts"
  ON forum_posts
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Функция для обновления счетчика голосов
CREATE OR REPLACE FUNCTION update_topic_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_topics 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.topic_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_topics 
    SET votes_count = GREATEST(votes_count - 1, 0) 
    WHERE id = OLD.topic_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления счетчика голосов
DROP TRIGGER IF EXISTS update_topic_votes_count_trigger ON topic_votes;
CREATE TRIGGER update_topic_votes_count_trigger
  AFTER INSERT OR DELETE ON topic_votes
  FOR EACH ROW EXECUTE FUNCTION update_topic_votes_count();