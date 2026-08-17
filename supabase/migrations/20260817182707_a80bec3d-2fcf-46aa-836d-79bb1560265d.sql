CREATE TABLE public.convites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  expira_em timestamp with time zone NOT NULL DEFAULT (now() + interval '12 hours'),
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.convites TO authenticated;
GRANT ALL ON public.convites TO service_role;

ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "convites admin" ON public.convites FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));