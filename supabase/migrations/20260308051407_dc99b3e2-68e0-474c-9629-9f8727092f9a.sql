
-- Event categories enum
CREATE TYPE public.event_category AS ENUM ('military', 'economy', 'trade', 'health', 'disaster', 'political');

-- Global events table
CREATE TABLE public.global_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.event_category NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'low',
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  country TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  url TEXT,
  raw_data JSONB,
  is_breaking BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_events ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read global_events" ON public.global_events FOR SELECT USING (true);
-- Anon write for edge functions
CREATE POLICY "Anon insert global_events" ON public.global_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update global_events" ON public.global_events FOR UPDATE USING (true);
CREATE POLICY "Anon delete global_events" ON public.global_events FOR DELETE USING (true);

-- Indexes
CREATE INDEX idx_global_events_category ON public.global_events(category);
CREATE INDEX idx_global_events_created ON public.global_events(created_at DESC);
CREATE INDEX idx_global_events_breaking ON public.global_events(is_breaking) WHERE is_breaking = true;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_events;
