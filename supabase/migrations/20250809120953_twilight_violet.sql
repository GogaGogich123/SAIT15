/*
  # Исправление RLS политик для управления новостями

  1. Политики
    - Добавляем политики для обновления и удаления новостей администраторами
    - Проверяем существующие политики

  2. Функции
    - Добавляем функцию для обновления updated_at
*/

-- Удаляем существующие политики для новостей (если есть)
DROP POLICY IF EXISTS "Allow admins to update news" ON news;
DROP POLICY IF EXISTS "Allow admins to delete news" ON news;
DROP POLICY IF EXISTS "Allow admins to insert news" ON news;

-- Создаем политики для администраторов
CREATE POLICY "Allow admins to insert news"
  ON news
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to update news"
  ON news
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to delete news"
  ON news
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_news_updated_at_trigger ON news;
CREATE TRIGGER update_news_updated_at_trigger
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_news_updated_at();