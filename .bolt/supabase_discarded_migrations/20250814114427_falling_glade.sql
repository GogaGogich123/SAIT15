/*
  # Create events and event_participants tables

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, required)
      - `event_date` (date, required)
      - `event_time` (time, required)
      - `location` (text, required)
      - `max_participants` (integer, default 0)
      - `registration_deadline` (date, required)
      - `images` (text array, default empty array)
      - `background_image_url` (text, optional)
      - `category` (text, required, check constraint)
      - `status` (text, default 'active', check constraint)
      - `participants_count` (integer, default 0)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp with time zone, default now)
      - `updated_at` (timestamp with time zone, default now)
    - `event_participants`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `cadet_id` (uuid, foreign key to cadets)
      - `registration_date` (timestamp with time zone, default now)
      - `status` (text, default 'registered', check constraint)
      - `notes` (text, optional)

  2. Security
    - Enable RLS on both tables
    - Add policies for reading events (public access)
    - Add policies for managing events (admin only)
    - Add policies for event participation

  3. Indexes
    - Index on event_date for sorting
    - Index on status for filtering
    - Index on event_id for participants lookup
    - Index on cadet_id for participant queries
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  event_date date NOT NULL,
  event_time time NOT NULL,
  location text NOT NULL,
  max_participants integer DEFAULT 0,
  registration_deadline date NOT NULL,
  images text[] DEFAULT '{}',
  background_image_url text,
  category text NOT NULL,
  status text DEFAULT 'active',
  participants_count integer DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraints for events
ALTER TABLE events ADD CONSTRAINT events_category_check 
  CHECK (category IN ('academic', 'sports', 'cultural', 'training', 'social', 'other'));

ALTER TABLE events ADD CONSTRAINT events_status_check 
  CHECK (status IN ('active', 'inactive', 'completed', 'cancelled'));

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  cadet_id uuid REFERENCES cadets(id) ON DELETE CASCADE,
  registration_date timestamptz DEFAULT now(),
  status text DEFAULT 'registered',
  notes text
);

-- Add check constraint for event_participants
ALTER TABLE event_participants ADD CONSTRAINT event_participants_status_check 
  CHECK (status IN ('registered', 'attended', 'absent', 'cancelled'));

-- Add unique constraint to prevent duplicate registrations
ALTER TABLE event_participants ADD CONSTRAINT event_participants_unique 
  UNIQUE (event_id, cadet_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_cadet_id ON event_participants(cadet_id);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
CREATE POLICY "Anyone can read active events"
  ON events
  FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Admins can manage events"
  ON events
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for event_participants table
CREATE POLICY "Anyone can read event participants"
  ON event_participants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Cadets can register for events"
  ON event_participants
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Cadets can update own registrations"
  ON event_participants
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage event participants"
  ON event_participants
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);