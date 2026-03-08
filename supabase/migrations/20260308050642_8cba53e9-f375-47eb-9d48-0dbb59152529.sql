
-- Create entity type and classification enums
CREATE TYPE public.entity_type AS ENUM ('aircraft', 'ship', 'base', 'strategic', 'alert');
CREATE TYPE public.entity_classification AS ENUM ('military', 'civilian', 'unknown');
CREATE TYPE public.alert_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.alert_type AS ENUM ('cluster', 'movement', 'airspace', 'proximity');

-- Entities table: stores latest position snapshots
CREATE TABLE public.entities (
  id TEXT PRIMARY KEY,
  type public.entity_type NOT NULL,
  classification public.entity_classification NOT NULL,
  name TEXT NOT NULL,
  callsign TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  source TEXT NOT NULL,
  details TEXT,
  country TEXT,
  flag_code TEXT,
  threat_score INTEGER DEFAULT 0,
  origin TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trail points table: historical position data
CREATE TABLE public.trail_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alerts table
CREATE TABLE public.alerts (
  id TEXT PRIMARY KEY,
  severity public.alert_severity NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_ids TEXT[] DEFAULT '{}',
  type public.alert_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Public read access (OSINT data is public)
CREATE POLICY "Public read entities" ON public.entities FOR SELECT USING (true);
CREATE POLICY "Public read trail_points" ON public.trail_points FOR SELECT USING (true);
CREATE POLICY "Public read alerts" ON public.alerts FOR SELECT USING (true);

-- Anon can write for data ingestion (no auth in this app)
CREATE POLICY "Anon insert entities" ON public.entities FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update entities" ON public.entities FOR UPDATE USING (true);
CREATE POLICY "Anon insert trail_points" ON public.trail_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update alerts" ON public.alerts FOR UPDATE USING (true);
CREATE POLICY "Anon delete alerts" ON public.alerts FOR DELETE USING (true);

-- Indexes
CREATE INDEX idx_trail_points_entity ON public.trail_points(entity_id, recorded_at DESC);
CREATE INDEX idx_trail_points_time ON public.trail_points(recorded_at);
CREATE INDEX idx_entities_type ON public.entities(type);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.entities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
