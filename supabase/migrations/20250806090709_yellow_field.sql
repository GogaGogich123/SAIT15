/*
  # Функция для обновления баллов кадета

  1. Функция
    - `update_cadet_scores` - обновляет баллы кадета в таблице scores и пересчитывает общий балл
  
  2. Безопасность
    - Функция доступна для выполнения администраторами
*/

-- Создаем функцию для обновления баллов кадета
CREATE OR REPLACE FUNCTION update_cadet_scores(
  p_cadet_id UUID,
  p_category TEXT,
  p_points INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_study_score INTEGER := 0;
  current_discipline_score INTEGER := 0;
  current_events_score INTEGER := 0;
  new_total_score INTEGER := 0;
BEGIN
  -- Получаем текущие баллы кадета
  SELECT 
    COALESCE(study_score, 0),
    COALESCE(discipline_score, 0),
    COALESCE(events_score, 0)
  INTO 
    current_study_score,
    current_discipline_score,
    current_events_score
  FROM scores 
  WHERE cadet_id = p_cadet_id;

  -- Если записи нет, создаем её
  IF NOT FOUND THEN
    INSERT INTO scores (cadet_id, study_score, discipline_score, events_score)
    VALUES (p_cadet_id, 0, 0, 0);
    current_study_score := 0;
    current_discipline_score := 0;
    current_events_score := 0;
  END IF;

  -- Обновляем баллы в зависимости от категории
  IF p_category = 'study' THEN
    current_study_score := current_study_score + p_points;
  ELSIF p_category = 'discipline' THEN
    current_discipline_score := current_discipline_score + p_points;
  ELSIF p_category = 'events' THEN
    current_events_score := current_events_score + p_points;
  END IF;

  -- Вычисляем новый общий балл
  new_total_score := current_study_score + current_discipline_score + current_events_score;

  -- Обновляем таблицу scores
  UPDATE scores 
  SET 
    study_score = current_study_score,
    discipline_score = current_discipline_score,
    events_score = current_events_score,
    updated_at = now()
  WHERE cadet_id = p_cadet_id;

  -- Обновляем общий балл в таблице cadets
  UPDATE cadets 
  SET 
    total_score = new_total_score,
    updated_at = now()
  WHERE id = p_cadet_id;

END;
$$;