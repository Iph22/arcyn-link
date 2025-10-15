-- Arcyn Eye (A.E) Schema Extensions
-- Run these SQL commands in your Supabase SQL editor to add A.E support

-- 1. Add message_type column to existing messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'user_message' 
  CHECK (message_type IN ('user_message', 'ai_response', 'ai_summary', 'ai_analysis'));

-- 2. Create channel_summaries table for storing A.E summaries
CREATE TABLE IF NOT EXISTS channel_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for channel_summaries
ALTER TABLE channel_summaries ENABLE ROW LEVEL SECURITY;

-- Policies for channel_summaries
CREATE POLICY "Users can view summaries for their team channels" ON channel_summaries 
  FOR SELECT USING (
    channel_id IN (
      SELECT id FROM channels 
      WHERE team = (SELECT team FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create summaries for their team channels" ON channel_summaries 
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    channel_id IN (
      SELECT id FROM channels 
      WHERE team = (SELECT team FROM user_profiles WHERE id = auth.uid())
    )
  );

-- 3. Create file_analyses table for storing A.E file analyses
CREATE TABLE IF NOT EXISTS file_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  analysis TEXT NOT NULL,
  analyzed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for file_analyses
ALTER TABLE file_analyses ENABLE ROW LEVEL SECURITY;

-- Policies for file_analyses
CREATE POLICY "Users can view analyses for their team channels" ON file_analyses 
  FOR SELECT USING (
    channel_id IN (
      SELECT id FROM channels 
      WHERE team = (SELECT team FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create analyses for their team channels" ON file_analyses 
  FOR INSERT WITH CHECK (
    analyzed_by = auth.uid() AND
    channel_id IN (
      SELECT id FROM channels 
      WHERE team = (SELECT team FROM user_profiles WHERE id = auth.uid())
    )
  );

-- 4. Create special A.E user profile (run this manually with service role key)
-- Note: This should be run with service role permissions, not as a regular user
INSERT INTO user_profiles (id, email, username, team) VALUES
  ('00000000-0000-0000-0000-000000000001', 'arcyn.eye@arcyn.ai', 'Arcyn Eye', 'ARCYN_X')
ON CONFLICT (id) DO NOTHING;

-- 5. Update messages table policies to allow A.E to insert messages
CREATE POLICY "Allow A.E to insert messages" ON messages 
  FOR INSERT WITH CHECK (
    user_id = '00000000-0000-0000-0000-000000000001' OR
    (user_id = auth.uid() AND
     channel_id IN (
       SELECT id FROM channels 
       WHERE team = (SELECT team FROM user_profiles WHERE id = auth.uid())
     ))
  );

-- Drop the old insert policy and replace with the new one
DROP POLICY IF EXISTS "Users can insert messages in their team channels" ON messages;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_channel_summaries_channel_id ON channel_summaries(channel_id);
CREATE INDEX IF NOT EXISTS idx_file_analyses_channel_id ON file_analyses(channel_id);

-- 7. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE channel_summaries;
ALTER PUBLICATION supabase_realtime ADD TABLE file_analyses;

-- 8. Create function to handle A.E user_id in messages
CREATE OR REPLACE FUNCTION handle_arcyn_eye_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow messages from Arcyn Eye (A.E) special user
  IF NEW.user_id = '00000000-0000-0000-0000-000000000001' THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, ensure they can only message in their team channels
  IF NEW.user_id = auth.uid() AND
     NEW.channel_id IN (
       SELECT id FROM channels 
       WHERE team = (SELECT team FROM user_profiles WHERE id = auth.uid())
     ) THEN
    RETURN NEW;
  END IF;
  
  -- Reject the insert if conditions aren't met
  RAISE EXCEPTION 'Access denied';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: You may need to adjust the user_id for Arcyn Eye based on your setup
-- The UUID '00000000-0000-0000-0000-000000000001' is a placeholder
-- In production, you might want to create a proper service account
