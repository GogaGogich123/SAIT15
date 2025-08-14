/*
  # Fix event participants count trigger

  1. Database Functions
    - Create or replace the `update_event_participants_count()` function
    - Ensure it properly counts participants and updates the events table

  2. Triggers
    - Recreate the trigger to ensure it fires correctly
    - Handle both INSERT and DELETE operations on event_participants

  3. Data Consistency
    - Update existing events with correct participant counts
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_event_participants_count_trigger ON event_participants;

-- Create or replace the function to update event participants count
CREATE OR REPLACE FUNCTION update_event_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT operation
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET participants_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id 
      AND status IN ('registered', 'confirmed')
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;

  -- Handle DELETE operation
  IF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET participants_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = OLD.event_id 
      AND status IN ('registered', 'confirmed')
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;

  -- Handle UPDATE operation (status changes)
  IF TG_OP = 'UPDATE' THEN
    -- Update count for both old and new event (in case event_id changed)
    UPDATE events 
    SET participants_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id 
      AND status IN ('registered', 'confirmed')
    )
    WHERE id = NEW.event_id;
    
    -- If event_id changed, also update the old event
    IF OLD.event_id != NEW.event_id THEN
      UPDATE events 
      SET participants_count = (
        SELECT COUNT(*) 
        FROM event_participants 
        WHERE event_id = OLD.event_id 
        AND status IN ('registered', 'confirmed')
      )
      WHERE id = OLD.event_id;
    END IF;
    
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_event_participants_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_participants_count();

-- Update existing events with correct participant counts
UPDATE events 
SET participants_count = (
  SELECT COUNT(*) 
  FROM event_participants 
  WHERE event_participants.event_id = events.id 
  AND status IN ('registered', 'confirmed')
);

-- Ensure all events have a participants_count (set to 0 if NULL)
UPDATE events 
SET participants_count = 0 
WHERE participants_count IS NULL;