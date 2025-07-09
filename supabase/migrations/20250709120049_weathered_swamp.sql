/*
  # Create search history table

  1. New Tables
    - `search_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `tmdb_id` (integer, TMDB ID for the content)
      - `image_path` (text, poster/profile image path)
      - `title` (text, content title/name)
      - `search_type` (text, type of search: movie/tv/person)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `search_history` table
    - Add policies for authenticated users to manage their own search history

  3. Indexes
    - Add performance indexes for user_id and created_at
*/

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id integer NOT NULL,
  image_path text,
  title text NOT NULL,
  search_type text NOT NULL CHECK (search_type IN ('movie', 'tv', 'person')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search history"
  ON search_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history"
  ON search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history"
  ON search_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON search_history(user_id);
CREATE INDEX IF NOT EXISTS search_history_created_at_idx ON search_history(created_at DESC);