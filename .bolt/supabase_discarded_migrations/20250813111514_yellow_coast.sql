/*
  # Create events table and event participants table

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, required)
      - `content` (text, optional)
      - `event_date` (date, required)
      - `event_time` (time, optional)
      - `location` (text, optional)
      - `max_participants` (integer, optional)
      - `registration_deadline` (timestamptz, optional)
      - `images` (text array, default empty)
      - `background_image_url` (text, optional)
      - `category` (text, required)
      - `status` (text, default 'active')
      - `participants_count` (integer, default 0)
      - `created_by` (uuid, optional)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)
    - `event_participants`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `cadet_id` (uuid, foreign key to cadets)
      - `registration_date` (timestamptz, default now)
      - `status` (text, default 'registered')
      - `notes` (text, optional)

  2. Security
    - Enable RLS on both tables
    - Add policies for reading events and participants
    - Add policies for admin management

  3. Indexes
    - Index on event_date for sorting
    - Index on status for filtering
    - Index on event_participants for lookups
</*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  content text,
  event_date date NOT NULL,
  event_time time,
  location text,
  max_participants integer DEFAULT 0,
  registration_deadline timestamptz,
  images text[] DEFAULT '{}',
  background_image_url text,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'active',
  participants_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  cadet_id uuid NOT NULL,
  registration_date timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'registered',
  notes text,
  UNIQUE(event_id, cadet_id)
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_participants_event_id_fkey'
  ) THEN
    ALTER TABLE event_participants 
    ADD CONSTRAINT event_participants_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_participants_cadet_id_fkey'
  ) THEN
    ALTER TABLE event_participants 
    ADD CONSTRAINT event_participants_cadet_id_fkey 
    FOREIGN KEY (cadet_id) REFERENCES cadets(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_created_by_fkey'
  ) THEN
    ALTER TABLE events 
    ADD CONSTRAINT events_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_status_check'
  ) THEN
    ALTER TABLE events 
    ADD CONSTRAINT events_status_check 
    CHECK (status IN ('active', 'cancelled', 'completed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_participants_status_check'
  ) THEN
    ALTER TABLE event_participants 
    ADD CONSTRAINT event_participants_status_check 
    CHECK (status IN ('registered', 'confirmed', 'cancelled'));
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_cadet_id ON event_participants(cadet_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY IF NOT EXISTS "Anyone can read active events"
  ON events
  FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY IF NOT EXISTS "Admins can manage events"
  ON events
  FOR ALL
  TO public
  USING (true);

-- Create policies for event_participants
CREATE POLICY IF NOT EXISTS "Anyone can read event participants"
  ON event_participants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Cadets can manage own registrations"
  ON event_participants
  FOR ALL
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage all event participants"
  ON event_participants
  FOR ALL
  TO public
  USING (true);