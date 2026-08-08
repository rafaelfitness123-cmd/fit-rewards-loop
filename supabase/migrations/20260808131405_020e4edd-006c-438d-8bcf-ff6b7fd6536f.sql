-- ============ PUBLICAÇÕES ============
CREATE TABLE public.publicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legenda text NOT NULL DEFAULT '',
  imagem_path text,
  tipo text NOT NULL DEFAULT 'normal',
  missao_id uuid REFERENCES public.missoes(id) ON DELETE SET NULL,
  missao_dados jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.publicacoes TO authenticated;
GRANT ALL ON public.publicacoes TO service_role;
ALTER TABLE public.publicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publicacoes visiveis para logados" ON public.publicacoes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "criar propria publicacao" ON public.publicacoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id);
CREATE POLICY "editar propria publicacao" ON public.publicacoes
  FOR UPDATE TO authenticated USING (auth.uid() = autor_id) WITH CHECK (auth.uid() = autor_id);
CREATE POLICY "excluir propria publicacao ou admin" ON public.publicacoes
  FOR DELETE TO authenticated USING (auth.uid() = autor_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX publicacoes_created_at_idx ON public.publicacoes (created_at DESC);
CREATE INDEX publicacoes_autor_idx ON public.publicacoes (autor_id, created_at DESC);

-- ============ CURTIDAS ============
CREATE TABLE public.publicacao_curtidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacao_id uuid NOT NULL REFERENCES public.publicacoes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publicacao_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.publicacao_curtidas TO authenticated;
GRANT ALL ON public.publicacao_curtidas TO service_role;
ALTER TABLE public.publicacao_curtidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curtidas visiveis para logados" ON public.publicacao_curtidas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "curtir como si mesmo" ON public.publicacao_curtidas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "descurtir propria curtida" ON public.publicacao_curtidas
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX curtidas_publicacao_idx ON public.publicacao_curtidas (publicacao_id);

-- ============ COMENTÁRIOS ============
CREATE TABLE public.publicacao_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacao_id uuid NOT NULL REFERENCES public.publicacoes(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  texto text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.publicacao_comentarios TO authenticated;
GRANT ALL ON public.publicacao_comentarios TO service_role;
ALTER TABLE public.publicacao_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comentarios visiveis para logados" ON public.publicacao_comentarios
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "comentar como si mesmo" ON public.publicacao_comentarios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id);
CREATE POLICY "excluir proprio comentario ou admin" ON public.publicacao_comentarios
  FOR DELETE TO authenticated USING (auth.uid() = autor_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX comentarios_publicacao_idx ON public.publicacao_comentarios (publicacao_id, created_at);

-- ============ DENÚNCIAS (estrutura para moderação futura) ============
CREATE TABLE public.publicacao_denuncias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacao_id uuid NOT NULL REFERENCES public.publicacoes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aberta',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.publicacao_denuncias TO authenticated;
GRANT ALL ON public.publicacao_denuncias TO service_role;
ALTER TABLE public.publicacao_denuncias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "denuncias visiveis para admin" ON public.publicacao_denuncias
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "denunciar como si mesmo" ON public.publicacao_denuncias
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin gerencia denuncias" ON public.publicacao_denuncias
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin remove denuncias" ON public.publicacao_denuncias
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_publicacoes_updated_at BEFORE UPDATE ON public.publicacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE (bucket privado 'publicacoes') ============
CREATE POLICY "fotos da comunidade visiveis para logados" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'publicacoes');
CREATE POLICY "enviar propria foto da comunidade" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'publicacoes' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "remover propria foto da comunidade" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'publicacoes' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );