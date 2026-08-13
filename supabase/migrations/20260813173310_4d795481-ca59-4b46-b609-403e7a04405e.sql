ALTER TABLE public.missoes ADD COLUMN IF NOT EXISTS raio_m integer NOT NULL DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visibilidade_local text NOT NULL DEFAULT 'todos';

CREATE TABLE IF NOT EXISTS public.seguidores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seguidor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seguido_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seguidor_id, seguido_id)
);

GRANT SELECT, INSERT, DELETE ON public.seguidores TO authenticated;
GRANT ALL ON public.seguidores TO service_role;

ALTER TABLE public.seguidores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seguidores visiveis para logados" ON public.seguidores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "seguir como si mesmo" ON public.seguidores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = seguidor_id);
CREATE POLICY "deixar de seguir" ON public.seguidores
  FOR DELETE TO authenticated USING (auth.uid() = seguidor_id);

CREATE OR REPLACE FUNCTION public.parceiros_proximos(_missao_id uuid, _raio_m double precision DEFAULT 100)
 RETURNS TABLE(cliente_id uuid, nome text, avatar text, lat double precision, lng double precision, distancia_m double precision)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH eu AS (
    SELECT p.lat, p.lng
    FROM public.posicoes_ativas p
    WHERE p.cliente_id = auth.uid()
      AND p.missao_id = _missao_id
      AND p.compartilhando = true
      AND p.atualizado_em > now() - interval '2 minutes'
  )
  SELECT o.cliente_id,
         pr.nome,
         pr.avatar,
         o.lat,
         o.lng,
         (6371000 * acos(LEAST(1, GREATEST(-1,
            cos(radians(eu.lat)) * cos(radians(o.lat)) * cos(radians(o.lng) - radians(eu.lng))
            + sin(radians(eu.lat)) * sin(radians(o.lat))
         )))) AS distancia_m
  FROM public.posicoes_ativas o
  JOIN eu ON true
  JOIN public.profiles pr ON pr.id = o.cliente_id
  WHERE o.cliente_id <> auth.uid()
    AND o.missao_id = _missao_id
    AND o.compartilhando = true
    AND pr.compartilhar_local = true
    AND (
      COALESCE(pr.visibilidade_local, 'todos') = 'todos'
      OR EXISTS (
        SELECT 1 FROM public.seguidores s
        WHERE s.seguidor_id = o.cliente_id AND s.seguido_id = auth.uid()
      )
    )
    AND o.atualizado_em > now() - interval '2 minutes'
    AND (6371000 * acos(LEAST(1, GREATEST(-1,
          cos(radians(eu.lat)) * cos(radians(o.lat)) * cos(radians(o.lng) - radians(eu.lng))
          + sin(radians(eu.lat)) * sin(radians(o.lat))
       )))) <= _raio_m;
$function$;