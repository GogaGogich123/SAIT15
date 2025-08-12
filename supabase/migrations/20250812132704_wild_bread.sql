/*
  # Create events and event participants tables

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, required)
      - `content` (text, optional detailed content)
      - `event_date` (date, required)
      - `event_time` (time, optional)
      - `location` (text, optional)
      - `max_participants` (integer, optional)
      - `registration_deadline` (timestamptz, optional)
      - `images` (text[], default empty array)
      - `background_image_url` (text, optional)
      - `category` (text, required - sport/education/culture/general)
      - `status` (text, default 'active' - active/cancelled/completed)
      - `participants_count` (integer, default 0)
      - `created_by` (uuid, optional foreign key to users)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)
    
    - `event_participants`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `cadet_id` (uuid, foreign key to cadets)
      - `registration_date` (timestamptz, default now)
      - `status` (text, default 'registered' - registered/confirmed/cancelled)
      - `notes` (text, optional)

  2. Security
    - Enable RLS on both tables
    - Add policies for reading events (public access)
    - Add policies for managing events (admin only)
    - Add policies for event participation (cadets can manage their own)

  3. Indexes
    - Index on event_date for sorting
    - Index on status for filtering
    - Index on event_id and cadet_id for participants
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  content text,
  event_date date NOT NULL,
  event_time time,
  location text,
  max_participants integer,
  registration_deadline timestamptz,
  images text[] DEFAULT '{}',
  background_image_url text,
  category text NOT NULL CHECK (category IN ('sport', 'education', 'culture', 'general')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  participants_count integer DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  cadet_id uuid NOT NULL REFERENCES cadets(id) ON DELETE CASCADE,
  registration_date timestamptz DEFAULT now(),
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled')),
  notes text,
  UNIQUE(event_id, cadet_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_cadet_id ON event_participants(cadet_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Anyone can read active events"
  ON events
  FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Admins can manage events"
  ON events
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Event participants policies
CREATE POLICY "Anyone can read event participants"
  ON event_participants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Cadets can manage own participation"
  ON event_participants
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM cadets 
      WHERE cadets.id = event_participants.cadet_id 
      AND cadets.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all event participants"
  ON event_participants
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Function to update participants count
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
    SET participants_count = participants_count - 1 
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update participants count
CREATE TRIGGER trigger_update_event_participants_count
  AFTER INSERT OR DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_participants_count();