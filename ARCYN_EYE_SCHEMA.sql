-- Arcyn Eye (A.E) Schema Extensions for Supabase
-- Run these SQL commands in your Supabase SQL editor

-- 1. Add message_type column to existing messages table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'user_message';
  END IF;
END $$;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check 
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

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view summaries for their team channels" ON channel_summaries;
DROP POLICY IF EXISTS "Users can create summaries for their team channels" ON channel_summaries;

-- Policies for channel_summaries
CREATE POLICY "Users can view summaries for their team channels" ON channel_summaries 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = channel_summaries.channel_id 
      AND channels.team = (SELECT team FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create summaries for their team channels" ON channel_summaries 
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = channel_summaries.channel_id 
      AND channels.team = (SELECT team FROM user_profiles WHERE id = auth.uid())
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view analyses for their team channels" ON file_analyses;
DROP POLICY IF EXISTS "Users can create analyses for their team channels" ON file_analyses;

-- Policies for file_analyses
CREATE POLICY "Users can view analyses for their team channels" ON file_analyses 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = file_analyses.channel_id 
      AND channels.team = (SELECT team FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create analyses for their team channels" ON file_analyses 
  FOR INSERT WITH CHECK (
    analyzed_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = file_analyses.channel_id 
      AND channels.team = (SELECT team FROM user_profiles WHERE id = auth.uid())
    )
  );

-- 4. Create special A.E user profile
-- OPTION 1: Temporarily disable the foreign key constraint (recommended)
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

INSERT INTO user_profiles (id, email, username, team) 
VALUES ('00000000-0000-0000-0000-000000000001', 'arcyn.eye@arcyn.ai', 'Arcyn Eye', 'ARCYN_X')
ON CONFLICT (id) DO NOTHING;

-- Re-add the foreign key constraint but make it NOT VALID for existing rows
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
ON DELETE CASCADE 
NOT VALID;

-- OPTION 2: If the above doesn't work, you can create without the special user
-- and manually create a real user through Supabase Auth, then update this ID
-- Just comment out the above and use a real user ID from auth.users

-- 5. Update messages table policies to allow A.E to insert messages
-- Drop the old insert policy first
DROP POLICY IF EXISTS "Users can insert messages in their team channels" ON messages;
DROP POLICY IF EXISTS "Allow A.E to insert messages" ON messages;

-- Create new combined insert policy
CREATE POLICY "Allow A.E to insert messages" ON messages 
  FOR INSERT WITH CHECK (
    user_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    (user_id = auth.uid() AND
     EXISTS (
       SELECT 1 FROM channels 
       WHERE channels.id = messages.channel_id 
       AND channels.team = (SELECT team FROM user_profiles WHERE id = auth.uid())
     ))
  );

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_channel_summaries_channel_id ON channel_summaries(channel_id);
CREATE INDEX IF NOT EXISTS idx_file_analyses_channel_id ON file_analyses(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_summaries_created_at ON channel_summaries(created_at);
CREATE INDEX IF NOT EXISTS idx_file_analyses_created_at ON file_analyses(created_at);

-- 7. Enable realtime for new tables (may require enabling realtime in Supabase dashboard first)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE channel_summaries;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE file_analyses;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 8. Create function to handle A.E user_id in messages (optional, may conflict with policies)
-- Note: This trigger function may not be necessary if the policies above work correctly
DROP TRIGGER IF EXISTS handle_arcyn_eye_messages_trigger ON messages;
DROP FUNCTION IF EXISTS handle_arcyn_eye_messages();

CREATE OR REPLACE FUNCTION handle_arcyn_eye_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow messages from Arcyn Eye (A.E) special user
  IF NEW.user_id = '00000000-0000-0000-0000-000000000001'::uuid THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, ensure they can only message in their team channels
  IF NEW.user_id = auth.uid() AND
     EXISTS (
       SELECT 1 FROM channels 
       WHERE channels.id = NEW.channel_id 
       AND channels.team = (SELECT team FROM user_profiles WHERE id = auth.uid())
     ) THEN
    RETURN NEW;
  END IF;
  
  -- Reject the insert if conditions aren't met
  RAISE EXCEPTION 'Access denied';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optionally create trigger (test if this conflicts with your RLS policies)
-- CREATE TRIGGER handle_arcyn_eye_messages_trigger
--   BEFORE INSERT ON messages
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_arcyn_eye_messages();

-- Verification queries (run these to check your setup)
-- SELECT * FROM channel_summaries LIMIT 5;
-- SELECT * FROM file_analyses LIMIT 5;
-- SELECT * FROM user_profiles WHERE id = '00000000-0000-0000-0000-000000000001';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type';