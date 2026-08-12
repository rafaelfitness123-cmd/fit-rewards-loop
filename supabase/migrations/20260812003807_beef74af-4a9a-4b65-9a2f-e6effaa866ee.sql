ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS compartilhar_local boolean NOT NULL DEFAULT false;

CREATE TABLE public.posicoes_ativas (
  cliente_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  missao_id uuid REFERENCES public.missoes(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  precisao numeric NOT NULL DEFAULT 0,
  compartilhando boolean NOT NULL DEFAULT true,
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posicoes_ativas TO authenticated;
GRANT ALL ON public.posicoes_ativas TO service_role;

ALTER TABLE public.posicoes_ativas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posicao propria" ON public.posicoes_ativas
  FOR ALL TO authenticated
  USING (auth.uid() = cliente_id)
  WITH CHECK (auth.uid() = cliente_id);

CREATE OR REPLACE FUNCTION public.parceiros_proximos(_missao_id uuid, _raio_m double precision DEFAULT 100)
RETURNS TABLE (cliente_id uuid, nome text, avatar text, lat double precision, lng double precision, distancia_m double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND o.atualizado_em > now() - interval '2 minutes'
    AND (6371000 * acos(LEAST(1, GREATEST(-1,
          cos(radians(eu.lat)) * cos(radians(o.lat)) * cos(radians(o.lng) - radians(eu.lng))
          + sin(radians(eu.lat)) * sin(radians(o.lat))
       )))) <= _raio_m;
$$;

REVOKE ALL ON FUNCTION public.parceiros_proximos(uuid, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.parceiros_proximos(uuid, double precision) TO authenticated;