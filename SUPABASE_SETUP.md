# Supabase Setup for Arcyn Link

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from the project settings
3. Update your `.env.local` file with these values

## 2. Database Schema

Run these SQL commands in your Supabase SQL editor:

### User Profiles Table
```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  team TEXT NOT NULL CHECK (team IN ('ARCYN_X', 'MODULEX', 'NEXALAB')),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### Channels Table
```sql
-- Create channels table
CREATE TABLE channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL CHECK (team IN ('ARCYN_X', 'MODULEX', 'NEXALAB')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Policies for channels
CREATE POLICY "Users can view channels for their team" ON channels 
  FOR SELECT USING (
    team = (SELECT team FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create channels for their team" ON channels 
  FOR INSERT WITH CHECK (
    team = (SELECT team FROM user_profiles WHERE id = auth.uid())
  );
```

### Messages Table
```sql
-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view messages in their team channels" ON messages 
  FOR SELECT USING (
    channel_id IN (
      SELECT id FROM channels 
      WHERE team = (SELECT team FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their team channels" ON messages 
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    channel_id IN (
      SELECT id FROM channels 
      WHERE team = (SELECT team FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages" ON messages 
  FOR UPDATE USING (user_id = auth.uid());
```

### Reactions Table (Optional)
```sql
-- Create reactions table
CREATE TABLE reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Policies for reactions
CREATE POLICY "Users can view reactions in their team channels" ON reactions 
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN channels c ON m.channel_id = c.id
      WHERE c.team = (SELECT team FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own reactions" ON reactions 
  FOR ALL USING (user_id = auth.uid());
```

### Indexes for Performance
```sql
-- Add indexes for better performance
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_channels_team ON channels(team);
CREATE INDEX idx_user_profiles_team ON user_profiles(team);
```

### Functions and Triggers
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for messages updated_at
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username, team)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'team', 'ARCYN_X')
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 3. Realtime Configuration

Enable realtime for the tables:

```sql
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
```

## 4. Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Default Data (Optional)

Insert some default channels:

```sql
-- Insert default channels for each team
INSERT INTO channels (name, team) VALUES
  ('general', 'ARCYN_X'),
  ('development', 'ARCYN_X'),
  ('general', 'MODULEX'),
  ('projects', 'MODULEX'),
  ('general', 'NEXALAB'),
  ('research', 'NEXALAB');
```

## 6. Testing

After setting up the schema:

1. Start your Next.js development server: `npm run dev`
2. Navigate to `/register` and create a new account
3. Try logging in and sending messages
4. Test real-time functionality by opening multiple browser tabs

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Users can only access data for their team
- Authentication is handled by Supabase Auth
- All policies enforce team-based access control
