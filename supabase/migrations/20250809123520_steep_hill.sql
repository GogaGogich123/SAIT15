/*
  # Создание RPC функций для форума

  1. Функции
    - increment_topic_views: увеличение счетчика просмотров темы
    - update_topic_stats: обновление статистики темы при добавлении/удалении постов

  2. Триггеры
    - Автоматическое обновление статистики тем при изменении постов
*/

-- Функция для увеличения счетчика просмотров темы
CREATE OR REPLACE FUNCTION increment_topic_views(topic_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE forum_topics 
  SET views_count = views_count + 1 
  WHERE id = topic_uuid;
END;
$$ LANGUAGE plpgsql;

-- Функция для обновления статистики темы
CREATE OR REPLACE FUNCTION update_topic_stats()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Увеличиваем счетчик постов и обновляем информацию о последнем посте
    UPDATE forum_topics 
    SET 
      posts_count = posts_count + 1,
      last_post_at = NEW.created_at,
      last_post_by = NEW.author_id,
      updated_at = now()
    WHERE id = NEW.topic_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Уменьшаем счетчик постов
    UPDATE forum_topics 
    SET 
      posts_count = GREATEST(posts_count - 1, 0),
      updated_at = now()
    WHERE id = OLD.topic_id;
    
    -- Обновляем информацию о последнем посте
    UPDATE forum_topics 
    SET 
      last_post_at = COALESCE(
        (SELECT created_at FROM forum_posts WHERE topic_id = OLD.topic_id ORDER BY created_at DESC LIMIT 1),
        (SELECT created_at FROM forum_topics WHERE id = OLD.topic_id)
      ),
      last_post_by = (SELECT author_id FROM forum_posts WHERE topic_id = OLD.topic_id ORDER BY created_at DESC LIMIT 1)
    WHERE id = OLD.topic_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления статистики тем
DROP TRIGGER IF EXISTS update_topic_stats_trigger ON forum_posts;
CREATE TRIGGER update_topic_stats_trigger
  AFTER INSERT OR DELETE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_stats();