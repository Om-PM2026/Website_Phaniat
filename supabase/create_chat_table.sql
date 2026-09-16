-- ==============================================================================
-- องค์การบริหารส่วนตำบลเพนียด (อบต.เพนียด)
-- TABLE: chat_messages (ระบบบันทึกประวัติการสนทนากับ AI Chatbot)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'bot')),
    message TEXT NOT NULL,
    user_name VARCHAR(255),
    user_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow Public Read & Insert
CREATE POLICY "Public Read Chat Messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Public Insert Chat Messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
