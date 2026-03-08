-- Allow anon to delete entities (needed for OpenSky refresh cycle)
CREATE POLICY "Anon delete entities" ON public.entities
  FOR DELETE TO anon, authenticated
  USING (true);