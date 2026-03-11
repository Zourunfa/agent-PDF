-- Create PDF Conversation History Tables
-- Migration: 0006_create_conversation_tables.sql

-- ============================================================================
-- 1. Extend user_pdfs table with conversation tracking columns
-- ============================================================================

ALTER TABLE user_pdfs ADD COLUMN IF NOT EXISTS page_count INTEGER;
ALTER TABLE user_pdfs ADD COLUMN IF NOT EXISTS text_summary TEXT;
ALTER TABLE user_pdfs ADD COLUMN IF NOT EXISTS parse_status TEXT DEFAULT 'pending' CHECK (parse_status IN ('pending', 'parsing', 'completed', 'failed'));
ALTER TABLE user_pdfs ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMP;

-- ============================================================================
-- 2. Create pdf_conversations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS pdf_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_id UUID REFERENCES user_pdfs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pdf_id, user_id)
);

-- Create indexes for pdf_conversations
CREATE INDEX IF NOT EXISTS idx_pdf_conversations_user_id ON pdf_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_conversations_pdf_id ON pdf_conversations(pdf_id);
CREATE INDEX IF NOT EXISTS idx_pdf_conversations_created_at ON pdf_conversations(created_at DESC);

-- ============================================================================
-- 3. Create conversation_messages table
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES pdf_conversations(id) ON DELETE CASCADE NOT NULL,
  pdf_id UUID REFERENCES user_pdfs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens INTEGER,
  processing_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for conversation_messages
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_pdf_id ON conversation_messages(pdf_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at DESC);

-- ============================================================================
-- 4. Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE pdf_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Create RLS Policies for pdf_conversations
-- ============================================================================

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON pdf_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON pdf_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON pdf_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Create RLS Policies for conversation_messages
-- ============================================================================

-- Users can view their own messages
CREATE POLICY "Users can view own messages"
  ON conversation_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert own messages"
  ON conversation_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. Create helper functions
-- ============================================================================

-- Function to update pdf_conversations stats when a message is inserted
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pdf_conversations
  SET 
    message_count = message_count + 1,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats on message insert
DROP TRIGGER IF EXISTS trigger_update_conversation_stats ON conversation_messages;
CREATE TRIGGER trigger_update_conversation_stats
AFTER INSERT ON conversation_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_stats();

-- ============================================================================
-- 8. Add comments
-- ============================================================================

COMMENT ON TABLE pdf_conversations IS 'Tracks conversations for each PDF per user';
COMMENT ON TABLE conversation_messages IS 'Stores individual messages in conversations';
COMMENT ON COLUMN pdf_conversations.message_count IS 'Denormalized count of messages for performance';
COMMENT ON COLUMN pdf_conversations.last_message_at IS 'Timestamp of the most recent message';
COMMENT ON COLUMN conversation_messages.role IS 'Either "user" or "assistant"';
COMMENT ON COLUMN conversation_messages.tokens IS 'Token count for the message (for billing)';
COMMENT ON COLUMN conversation_messages.processing_time IS 'Processing time in milliseconds (for assistant messages)';
