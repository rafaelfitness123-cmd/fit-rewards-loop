-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','cliente');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  cpf text UNIQUE,
  avatar text,
  pontos integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "profiles visiveis para logados" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "atualizar proprio perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin remove perfil" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "inserir proprio perfil" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "ver papeis" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- QR CODES
CREATE TABLE public.qrcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL DEFAULT 'QR Code',
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz,
  ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qrcodes TO authenticated;
GRANT ALL ON public.qrcodes TO service_role;
ALTER TABLE public.qrcodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qr visivel" ON public.qrcodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "qr admin" ON public.qrcodes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- TREINOS
CREATE TABLE public.treinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entrada timestamptz NOT NULL DEFAULT now(),
  saida timestamptz,
  pontos_concedidos boolean NOT NULL DEFAULT false,
  pontos_entrada integer NOT NULL DEFAULT 0,
  pontos_saida integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treinos TO authenticated;
GRANT ALL ON public.treinos TO service_role;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "treinos visiveis" ON public.treinos FOR SELECT TO authenticated USING (true);
CREATE POLICY "treinos proprios" ON public.treinos FOR ALL TO authenticated USING (auth.uid() = cliente_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = cliente_id OR public.has_role(auth.uid(),'admin'));

-- MISSOES
CREATE TABLE public.missoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'diaria',
  objetivo text NOT NULL DEFAULT 'treinos',
  dia_semana integer,
  quantidade numeric NOT NULL DEFAULT 1,
  pontos integer NOT NULL DEFAULT 0,
  inicio date,
  fim date,
  ativa boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.missoes TO authenticated;
GRANT ALL ON public.missoes TO service_role;
ALTER TABLE public.missoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missoes visiveis" ON public.missoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "missoes admin" ON public.missoes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROGRESSO
CREATE TABLE public.progresso_missoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  missao_id uuid NOT NULL REFERENCES public.missoes(id) ON DELETE CASCADE,
  periodo text NOT NULL,
  progresso numeric NOT NULL DEFAULT 0,
  aceita boolean NOT NULL DEFAULT false,
  concluida boolean NOT NULL DEFAULT false,
  concedida boolean NOT NULL DEFAULT false,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, missao_id, periodo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progresso_missoes TO authenticated;
GRANT ALL ON public.progresso_missoes TO service_role;
ALTER TABLE public.progresso_missoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progresso visivel" ON public.progresso_missoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "progresso proprio" ON public.progresso_missoes FOR ALL TO authenticated USING (auth.uid() = cliente_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = cliente_id OR public.has_role(auth.uid(),'admin'));

-- CORRIDAS (GPS)
CREATE TABLE public.corridas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  missao_id uuid REFERENCES public.missoes(id) ON DELETE SET NULL,
  distancia_m numeric NOT NULL DEFAULT 0,
  duracao_s integer NOT NULL DEFAULT 0,
  iniciada_em timestamptz NOT NULL DEFAULT now(),
  finalizada_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corridas TO authenticated;
GRANT ALL ON public.corridas TO service_role;
ALTER TABLE public.corridas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corridas visiveis" ON public.corridas FOR SELECT TO authenticated USING (true);
CREATE POLICY "corridas proprias" ON public.corridas FOR ALL TO authenticated USING (auth.uid() = cliente_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = cliente_id OR public.has_role(auth.uid(),'admin'));

-- RECOMPENSAS
CREATE TABLE public.recompensas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  pontos integer NOT NULL DEFAULT 0,
  quantidade integer NOT NULL DEFAULT 0,
  ativa boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recompensas TO authenticated;
GRANT ALL ON public.recompensas TO service_role;
ALTER TABLE public.recompensas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recompensas visiveis" ON public.recompensas FOR SELECT TO authenticated USING (true);
CREATE POLICY "recompensas admin" ON public.recompensas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- RESGATES
CREATE TABLE public.resgates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_nome text NOT NULL DEFAULT '',
  recompensa_id uuid REFERENCES public.recompensas(id) ON DELETE SET NULL,
  recompensa_nome text NOT NULL DEFAULT '',
  pontos integer NOT NULL DEFAULT 0,
  data timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'solicitado'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resgates TO authenticated;
GRANT ALL ON public.resgates TO service_role;
ALTER TABLE public.resgates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resgates visiveis" ON public.resgates FOR SELECT TO authenticated USING (true);
CREATE POLICY "resgates criar proprio" ON public.resgates FOR INSERT TO authenticated WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "resgates admin" ON public.resgates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "resgates admin delete" ON public.resgates FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- HISTORICO
CREATE TABLE public.historico_pontos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL DEFAULT 0,
  motivo text NOT NULL DEFAULT '',
  data timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_pontos TO authenticated;
GRANT ALL ON public.historico_pontos TO service_role;
ALTER TABLE public.historico_pontos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "historico visivel" ON public.historico_pontos FOR SELECT TO authenticated USING (true);
CREATE POLICY "historico proprio" ON public.historico_pontos FOR ALL TO authenticated USING (auth.uid() = cliente_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = cliente_id OR public.has_role(auth.uid(),'admin'));

-- AVISOS
CREATE TABLE public.avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  texto text NOT NULL DEFAULT '',
  data timestamptz NOT NULL DEFAULT now(),
  destaque boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avisos TO authenticated;
GRANT ALL ON public.avisos TO service_role;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avisos visiveis" ON public.avisos FOR SELECT TO authenticated USING (true);
CREATE POLICY "avisos admin" ON public.avisos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CONFIG
CREATE TABLE public.config (
  id text PRIMARY KEY,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.config TO authenticated;
GRANT ALL ON public.config TO service_role;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config visivel" ON public.config FOR SELECT TO authenticated USING (true);
CREATE POLICY "config admin" ON public.config FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.config (id, dados) VALUES
  ('gamificacao', '{"pontosCheckin":10,"usarCheckout":true,"pontosCheckout":5,"minutosEntreTreinos":60,"bonusSequencia":[{"dias":3,"pontos":20},{"dias":5,"pontos":50},{"dias":7,"pontos":100}]}'::jsonb),
  ('dias', '{"0":70,"1":10,"2":10,"3":10,"4":20,"5":30,"6":50}'::jsonb);
