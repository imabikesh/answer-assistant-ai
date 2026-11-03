CREATE TABLE public.ai_processing_access_state (id text PRIMARY KEY, message text NOT NULL, status integer NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_processing_access_state TO service_role;
REVOKE ALL ON public.ai_processing_access_state FROM anon, authenticated;
ALTER TABLE public.ai_processing_access_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages AI access state" ON public.ai_processing_access_state FOR ALL TO service_role USING (true) WITH CHECK (true);