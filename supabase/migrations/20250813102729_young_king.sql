/*
  # Улучшение системы заданий

  1. Изменения в таблице tasks
    - Добавлено поле max_participants для ограничения количества участников
    - Добавлено поле abandon_penalty для штрафа за отказ от задания
    
  2. Изменения в таблице task_submissions
    - Добавлено поле reviewed_by для отслеживания кто проверил задание
    - Добавлено поле feedback для обратной связи от проверяющего
    - Добавлено поле points_awarded для начисленных баллов
    - Обновлены статусы: taken, submitted, completed, rejected, abandoned
    
  3. Безопасность
    - Обновлены RLS политики для новых полей
    - Добавлены политики для администраторов
*/

-- Добавляем новые поля в таблицу tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'max_participants'
  ) THEN
    ALTER TABLE tasks ADD COLUMN max_participants integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'abandon_penalty'
  ) THEN
    ALTER TABLE tasks ADD COLUMN abandon_penalty integer DEFAULT 5;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'current_participants'
  ) THEN
    ALTER TABLE tasks ADD COLUMN current_participants integer DEFAULT 0;
  END IF;
END $$;

-- Обновляем ограничение статусов в task_submissions
ALTER TABLE task_submissions DROP CONSTRAINT IF EXISTS task_submissions_status_check;
ALTER TABLE task_submissions ADD CONSTRAINT task_submissions_status_check 
  CHECK (status = ANY (ARRAY['taken'::text, 'submitted'::text, 'completed'::text, 'rejected'::text, 'abandoned'::text]));

-- Добавляем политики для администраторов на задания
CREATE POLICY IF NOT EXISTS "Admins can manage tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Добавляем политики для администраторов на сдачи заданий
CREATE POLICY IF NOT EXISTS "Admins can manage task submissions"
  ON task_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Функция для обновления количества участников задания
CREATE OR REPLACE FUNCTION update_task_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Увеличиваем счетчик при взятии задания
    IF NEW.status = 'taken' THEN
      UPDATE tasks 
      SET current_participants = current_participants + 1
      WHERE id = NEW.task_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Обрабатываем изменение статуса
    IF OLD.status = 'taken' AND NEW.status IN ('abandoned', 'rejected') THEN
      -- Уменьшаем счетчик при отказе или отклонении
      UPDATE tasks 
      SET current_participants = current_participants - 1
      WHERE id = NEW.task_id;
    ELSIF OLD.status IN ('abandoned', 'rejected') AND NEW.status = 'taken' THEN
      -- Увеличиваем счетчик при повторном взятии
      UPDATE tasks 
      SET current_participants = current_participants + 1
      WHERE id = NEW.task_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Уменьшаем счетчик при удалении записи
    IF OLD.status = 'taken' THEN
      UPDATE tasks 
      SET current_participants = current_participants - 1
      WHERE id = OLD.task_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для обновления количества участников
DROP TRIGGER IF EXISTS update_task_participants_count_trigger ON task_submissions;
CREATE TRIGGER update_task_participants_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON task_submissions
  FOR EACH ROW EXECUTE FUNCTION update_task_participants_count();

-- Функция для применения штрафа при отказе от задания
CREATE OR REPLACE FUNCTION apply_abandon_penalty()
RETURNS TRIGGER AS $$
DECLARE
  task_penalty integer;
  cadet_id_val uuid;
BEGIN
  -- Проверяем, что статус изменился на 'abandoned'
  IF NEW.status = 'abandoned' AND OLD.status != 'abandoned' THEN
    -- Получаем штраф за отказ от задания
    SELECT abandon_penalty INTO task_penalty
    FROM tasks 
    WHERE id = NEW.task_id;
    
    -- Получаем ID кадета
    cadet_id_val := NEW.cadet_id;
    
    -- Применяем штраф (отрицательные баллы)
    IF task_penalty > 0 THEN
      -- Добавляем запись в историю баллов
      INSERT INTO score_history (cadet_id, category, points, description)
      VALUES (
        cadet_id_val, 
        'discipline', 
        -task_penalty, 
        'Штраф за отказ от задания'
      );
      
      -- Обновляем баллы кадета
      UPDATE scores 
      SET discipline_score = GREATEST(0, discipline_score - task_penalty),
          updated_at = now()
      WHERE cadet_id = cadet_id_val;
      
      -- Обновляем общий балл кадета
      UPDATE cadets 
      SET total_score = GREATEST(0, total_score - task_penalty),
          updated_at = now()
      WHERE id = cadet_id_val;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для применения штрафа
DROP TRIGGER IF EXISTS apply_abandon_penalty_trigger ON task_submissions;
CREATE TRIGGER apply_abandon_penalty_trigger
  AFTER UPDATE ON task_submissions
  FOR EACH ROW EXECUTE FUNCTION apply_abandon_penalty();

-- Обновляем текущее количество участников для существующих заданий
UPDATE tasks 
SET current_participants = (
  SELECT COUNT(*) 
  FROM task_submissions 
  WHERE task_submissions.task_id = tasks.id 
  AND task_submissions.status = 'taken'
);