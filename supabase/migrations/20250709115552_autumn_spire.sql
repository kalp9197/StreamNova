/*
  # Create search history table

  1. New Tables
    - `search_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `tmdb_id` (integer, TMDB ID)
      - `image_path` (text, image path)
      - `title` (text, title)
      - `search_type` (text, type of search)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `search_history` table
    - Add policies for users to manage their own search history
*/

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
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
  USING (uid() = user_id);

CREATE POLICY "Users can insert their own search history"
  ON search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can delete their own search history"
  ON search_history
  FOR DELETE
  TO authenticated
  USING (uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON search_history(user_id);
CREATE INDEX IF NOT EXISTS search_history_created_at_idx ON search_history(created_at DESC);