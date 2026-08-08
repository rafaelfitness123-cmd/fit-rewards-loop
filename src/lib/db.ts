// Camada de dados — cache em memória sincronizado com o banco (Lovable Cloud).
import { supabase } from "@/integrations/supabase/client";

export type Admin = { usuario: string; senha: string };

export type Cliente = {
  id: string;
  nome: string;
  cpf: string;
  senha: string;
  avatar?: string | undefined;
  criadoEm: string;
};

export type Treino = {
  id: string;
  clienteId: string;
  entrada: string;
  saida: string | null;
  pontosConcedidos: boolean;
  pontosEntrada: number;
  pontosSaida: number;
};

export type QRCodeItem = {
  id: string;
  codigo: string;
  nome: string;
  criadoEm: string;
  expiraEm: string | null;
  ativo: boolean;
};

export type MissaoTipo = "diaria" | "semanal" | "mensal" | "especial";
export type MissaoObjetivo = "treinos" | "dia_semana" | "distancia";

export type Missao = {
  id: string;
  nome: string;
  descricao: string;
  tipo: MissaoTipo;
  objetivo: MissaoObjetivo;
  diaSemana: number | null;
  quantidade: number;
  pontos: number;
  inicio: string | null;
  fim: string | null;
  ativa: boolean;
};

export type ProgressoMissao = {
  id: string; // clienteId|missaoId|periodo
  clienteId: string;
  missaoId: string;
  periodo: string;
  progresso: number;
  aceita: boolean;
  concluida: boolean;
  concedida: boolean;
  atualizadoEm: string;
};

export type Corrida = {
  id: string;
  clienteId: string;
  missaoId: string | null;
  distanciaM: number;
  duracaoS: number;
  iniciadaEm: string;
  finalizadaEm: string | null;
};

export type Recompensa = {
  id: string;
  nome: string;
  descricao: string;
  pontos: number;
  quantidade: number;
  ativa: boolean;
};

export type ResgateStatus = "solicitado" | "aprovado" | "entregue" | "cancelado";

export type Resgate = {
  id: string;
  clienteId: string;
  clienteNome: string;
  recompensaId: string;
  recompensaNome: string;
  pontos: number;
  data: string;
  status: ResgateStatus;
};

export type HistoricoPonto = {
  id: string;
  clienteId: string;
  delta: number;
  motivo: string;
  data: string;
};

export type BonusSequencia = { dias: number; pontos: number };

export type ConfigGamificacao = {
  pontosCheckin: number;
  usarCheckout: boolean;
  pontosCheckout: number;
  bonusSequencia: BonusSequencia[];
  minutosEntreTreinos: number;
  /** Tempo mínimo de permanência (min) para receber os pontos do dia. */
  minutosMinimosTreino: number;
};

export type ConfigDias = Record<string, number>;

export type Aviso = {
  id: string;
  titulo: string;
  texto: string;
  data: string;
  destaque: boolean;
};

export type Sessao =
  | { tipo: "admin"; usuario: string }
  | { tipo: "cliente"; clienteId: string }
  | null;

export const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export const DEFAULT_CONFIG_DIAS: ConfigDias = {
  "0": 70,
  "1": 10,
  "2": 10,
  "3": 10,
  "4": 20,
  "5": 30,
  "6": 50,
};

export const DEFAULT_CONFIG: ConfigGamificacao = {
  pontosCheckin: 10,
  usarCheckout: true,
  pontosCheckout: 5,
  bonusSequencia: [
    { dias: 3, pontos: 20 },
    { dias: 5, pontos: 50 },
    { dias: 7, pontos: 100 },
  ],
  minutosEntreTreinos: 60,
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ---------------- cache ----------------
type Cache = {
  pronto: boolean;
  carregando: boolean;
  sessao: Sessao;
  clientes: Cliente[];
  treinos: Treino[];
  qrs: QRCodeItem[];
  missoes: Missao[];
  progressos: ProgressoMissao[];
  corridas: Corrida[];
  recompensas: Recompensa[];
  resgates: Resgate[];
  historico: HistoricoPonto[];
  avisos: Aviso[];
  pontos: Record<string, number>;
  config: ConfigGamificacao;
  configDias: ConfigDias;
};

export const cache: Cache = {
  pronto: false,
  carregando: false,
  sessao: null,
  clientes: [],
  treinos: [],
  qrs: [],
  missoes: [],
  progressos: [],
  corridas: [],
  recompensas: [],
  resgates: [],
  historico: [],
  avisos: [],
  pontos: {},
  config: DEFAULT_CONFIG,
  configDias: DEFAULT_CONFIG_DIAS,
};

const ouvintes = new Set<() => void>();
export function inscrever(fn: () => void) {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}
export function notificar() {
  ouvintes.forEach((fn) => fn());
}

const erro = (ctx: string) => (r: { error: unknown }) => {
  if (r.error) console.error(`[db:${ctx}]`, r.error);
  return r;
};

// ---------------- mapeadores ----------------
type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown) => Number(v ?? 0);

const mapCliente = (r: Row): Cliente => ({
  id: str(r["id"]),
  nome: str(r["nome"]),
  cpf: str(r["cpf"]),
  senha: "",
  avatar: (r["avatar"] as string | null) ?? undefined,
  criadoEm: str(r["criado_em"]),
});

const mapTreino = (r: Row): Treino => ({
  id: str(r["id"]),
  clienteId: str(r["cliente_id"]),
  entrada: str(r["entrada"]),
  saida: (r["saida"] as string | null) ?? null,
  pontosConcedidos: Boolean(r["pontos_concedidos"]),
  pontosEntrada: num(r["pontos_entrada"]),
  pontosSaida: num(r["pontos_saida"]),
});

const mapQr = (r: Row): QRCodeItem => ({
  id: str(r["id"]),
  codigo: str(r["codigo"]),
  nome: str(r["nome"]),
  criadoEm: str(r["criado_em"]),
  expiraEm: (r["expira_em"] as string | null) ?? null,
  ativo: Boolean(r["ativo"]),
});

const mapMissao = (r: Row): Missao => ({
  id: str(r["id"]),
  nome: str(r["nome"]),
  descricao: str(r["descricao"]),
  tipo: str(r["tipo"]) as MissaoTipo,
  objetivo: str(r["objetivo"]) as MissaoObjetivo,
  diaSemana: r["dia_semana"] == null ? null : num(r["dia_semana"]),
  quantidade: num(r["quantidade"]),
  pontos: num(r["pontos"]),
  inicio: (r["inicio"] as string | null) ?? null,
  fim: (r["fim"] as string | null) ?? null,
  ativa: Boolean(r["ativa"]),
});

const mapProgresso = (r: Row): ProgressoMissao => ({
  id: `${str(r["cliente_id"])}|${str(r["missao_id"])}|${str(r["periodo"])}`,
  clienteId: str(r["cliente_id"]),
  missaoId: str(r["missao_id"]),
  periodo: str(r["periodo"]),
  progresso: num(r["progresso"]),
  aceita: Boolean(r["aceita"]),
  concluida: Boolean(r["concluida"]),
  concedida: Boolean(r["concedida"]),
  atualizadoEm: str(r["atualizado_em"]),
});

const mapCorrida = (r: Row): Corrida => ({
  id: str(r["id"]),
  clienteId: str(r["cliente_id"]),
  missaoId: (r["missao_id"] as string | null) ?? null,
  distanciaM: num(r["distancia_m"]),
  duracaoS: num(r["duracao_s"]),
  iniciadaEm: str(r["iniciada_em"]),
  finalizadaEm: (r["finalizada_em"] as string | null) ?? null,
});

const mapRecompensa = (r: Row): Recompensa => ({
  id: str(r["id"]),
  nome: str(r["nome"]),
  descricao: str(r["descricao"]),
  pontos: num(r["pontos"]),
  quantidade: num(r["quantidade"]),
  ativa: Boolean(r["ativa"]),
});

const mapResgate = (r: Row): Resgate => ({
  id: str(r["id"]),
  clienteId: str(r["cliente_id"]),
  clienteNome: str(r["cliente_nome"]),
  recompensaId: str(r["recompensa_id"]),
  recompensaNome: str(r["recompensa_nome"]),
  pontos: num(r["pontos"]),
  data: str(r["data"]),
  status: str(r["status"]) as ResgateStatus,
});

const mapHistorico = (r: Row): HistoricoPonto => ({
  id: str(r["id"]),
  clienteId: str(r["cliente_id"]),
  delta: num(r["delta"]),
  motivo: str(r["motivo"]),
  data: str(r["data"]),
});

const mapAviso = (r: Row): Aviso => ({
  id: str(r["id"]),
  titulo: str(r["titulo"]),
  texto: str(r["texto"]),
  data: str(r["data"]),
  destaque: Boolean(r["destaque"]),
});

// ---------------- carga ----------------
const db = supabase as unknown as {
  from: (t: string) => any;
  auth: (typeof supabase)["auth"];
};

export async function carregarTudo() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user ?? null;
  if (!user) {
    cache.sessao = null;
    cache.pronto = true;
    notificar();
    return;
  }

  const [
    profiles,
    papeis,
    treinos,
    qrs,
    missoes,
    progressos,
    corridas,
    recompensas,
    resgates,
    historico,
    avisos,
    config,
  ] = await Promise.all([
    db.from("profiles").select("*").order("nome"),
    db.from("user_roles").select("*").eq("user_id", user.id),
    db.from("treinos").select("*").order("entrada", { ascending: false }),
    db.from("qrcodes").select("*").order("criado_em", { ascending: false }),
    db.from("missoes").select("*").order("criado_em", { ascending: false }),
    db.from("progresso_missoes").select("*"),
    db.from("corridas").select("*").order("iniciada_em", { ascending: false }),
    db.from("recompensas").select("*").order("criado_em", { ascending: false }),
    db.from("resgates").select("*").order("data", { ascending: false }),
    db.from("historico_pontos").select("*").order("data", { ascending: false }),
    db.from("avisos").select("*").order("data", { ascending: false }),
    db.from("config").select("*"),
  ]);

  const perfis = (profiles.data ?? []) as Row[];
  cache.clientes = perfis.map(mapCliente).filter((c) => !!c.cpf && c.cpf !== "admin");
  cache.pontos = Object.fromEntries(perfis.map((r) => [str(r["id"]), num(r["pontos"])]));
  cache.treinos = ((treinos.data ?? []) as Row[]).map(mapTreino);
  cache.qrs = ((qrs.data ?? []) as Row[]).map(mapQr);
  cache.missoes = ((missoes.data ?? []) as Row[]).map(mapMissao);
  cache.progressos = ((progressos.data ?? []) as Row[]).map(mapProgresso);
  cache.corridas = ((corridas.data ?? []) as Row[]).map(mapCorrida);
  cache.recompensas = ((recompensas.data ?? []) as Row[]).map(mapRecompensa);
  cache.resgates = ((resgates.data ?? []) as Row[]).map(mapResgate);
  cache.historico = ((historico.data ?? []) as Row[]).map(mapHistorico);
  cache.avisos = ((avisos.data ?? []) as Row[]).map(mapAviso);

  for (const row of (config.data ?? []) as Row[]) {
    if (str(row["id"]) === "gamificacao")
      cache.config = { ...DEFAULT_CONFIG, ...(row["dados"] as object) };
    if (str(row["id"]) === "dias")
      cache.configDias = { ...DEFAULT_CONFIG_DIAS, ...(row["dados"] as object) };
  }

  const ehAdmin = (papeis.data ?? []).some((p: Row) => str(p["role"]) === "admin");
  const perfil = perfis.find((p) => str(p["id"]) === user.id);
  cache.sessao = ehAdmin
    ? { tipo: "admin", usuario: perfil ? str(perfil["nome"]) : "admin" }
    : { tipo: "cliente", clienteId: user.id };

  cache.pronto = true;
  notificar();
}

// ---------------- sincronização genérica ----------------
function diff<T extends { id: string }>(prev: T[], next: T[]) {
  const antes = new Map(prev.map((i) => [i.id, i]));
  const depois = new Map(next.map((i) => [i.id, i]));
  const upserts = next.filter(
    (i) => JSON.stringify(antes.get(i.id)) !== JSON.stringify(i),
  );
  const removidos = prev.filter((i) => !depois.has(i.id)).map((i) => i.id);
  return { upserts, removidos };
}

function sincronizar<T extends { id: string }>(
  tabela: string,
  prev: T[],
  next: T[],
  toRow: (i: T) => Row,
) {
  const { upserts, removidos } = diff(prev, next);
  if (upserts.length)
    void db.from(tabela).upsert(upserts.map(toRow)).then(erro(tabela));
  if (removidos.length)
    void db.from(tabela).delete().in("id", removidos).then(erro(tabela));
}

// ---------------- getters / setters ----------------
export const getClientes = () => cache.clientes;
export function setClientes(lista: Cliente[]) {
  const prev = cache.clientes;
  cache.clientes = lista;
  notificar();
  sincronizar("profiles", prev, lista, (c) => ({
    id: c.id,
    nome: c.nome,
    cpf: c.cpf,
    avatar: c.avatar ?? null,
    pontos: cache.pontos[c.id] ?? 0,
  }));
}

export const getTreinos = () => cache.treinos;
export function setTreinos(lista: Treino[]) {
  const prev = cache.treinos;
  cache.treinos = lista;
  notificar();
  sincronizar("treinos", prev, lista, (t) => ({
    id: t.id,
    cliente_id: t.clienteId,
    entrada: t.entrada,
    saida: t.saida,
    pontos_concedidos: t.pontosConcedidos,
    pontos_entrada: t.pontosEntrada,
    pontos_saida: t.pontosSaida,
  }));
}

export const getQRs = () => cache.qrs;
export function setQRs(lista: QRCodeItem[]) {
  const prev = cache.qrs;
  cache.qrs = lista;
  notificar();
  sincronizar("qrcodes", prev, lista, (q) => ({
    id: q.id,
    codigo: q.codigo,
    nome: q.nome,
    criado_em: q.criadoEm,
    expira_em: q.expiraEm,
    ativo: q.ativo,
  }));
}

export const getMissoes = () => cache.missoes;
export function setMissoes(lista: Missao[]) {
  const prev = cache.missoes;
  cache.missoes = lista;
  notificar();
  sincronizar("missoes", prev, lista, (m) => ({
    id: m.id,
    nome: m.nome,
    descricao: m.descricao,
    tipo: m.tipo,
    objetivo: m.objetivo,
    dia_semana: m.diaSemana,
    quantidade: m.quantidade,
    pontos: m.pontos,
    inicio: m.inicio,
    fim: m.fim,
    ativa: m.ativa,
  }));
}

export const getProgressos = () => cache.progressos;
export function setProgressos(lista: ProgressoMissao[]) {
  const prev = new Map(cache.progressos.map((p) => [p.id, JSON.stringify(p)]));
  cache.progressos = lista;
  notificar();
  const mudados = lista.filter((p) => prev.get(p.id) !== JSON.stringify(p));
  if (!mudados.length) return;
  void db
    .from("progresso_missoes")
    .upsert(
      mudados.map((p) => ({
        cliente_id: p.clienteId,
        missao_id: p.missaoId,
        periodo: p.periodo,
        progresso: p.progresso,
        aceita: p.aceita,
        concluida: p.concluida,
        concedida: p.concedida,
        atualizado_em: p.atualizadoEm,
      })),
      { onConflict: "cliente_id,missao_id,periodo" },
    )
    .then(erro("progresso_missoes"));
}

export const getCorridas = () => cache.corridas;
export function setCorridas(lista: Corrida[]) {
  const prev = cache.corridas;
  cache.corridas = lista;
  notificar();
  sincronizar("corridas", prev, lista, (c) => ({
    id: c.id,
    cliente_id: c.clienteId,
    missao_id: c.missaoId,
    distancia_m: c.distanciaM,
    duracao_s: c.duracaoS,
    iniciada_em: c.iniciadaEm,
    finalizada_em: c.finalizadaEm,
  }));
}

export const getRecompensas = () => cache.recompensas;
export function setRecompensas(lista: Recompensa[]) {
  const prev = cache.recompensas;
  cache.recompensas = lista;
  notificar();
  sincronizar("recompensas", prev, lista, (r) => ({
    id: r.id,
    nome: r.nome,
    descricao: r.descricao,
    pontos: r.pontos,
    quantidade: r.quantidade,
    ativa: r.ativa,
  }));
}

export const getResgates = () => cache.resgates;
export function setResgates(lista: Resgate[]) {
  const prev = cache.resgates;
  cache.resgates = lista;
  notificar();
  sincronizar("resgates", prev, lista, (r) => ({
    id: r.id,
    cliente_id: r.clienteId,
    cliente_nome: r.clienteNome,
    recompensa_id: r.recompensaId || null,
    recompensa_nome: r.recompensaNome,
    pontos: r.pontos,
    data: r.data,
    status: r.status,
  }));
}

export const getHistorico = () => cache.historico;
export function setHistorico(lista: HistoricoPonto[]) {
  const prev = cache.historico;
  cache.historico = lista;
  notificar();
  sincronizar("historico_pontos", prev, lista, (h) => ({
    id: h.id,
    cliente_id: h.clienteId,
    delta: h.delta,
    motivo: h.motivo,
    data: h.data,
  }));
}

export const getAvisos = () => cache.avisos;
export function setAvisos(lista: Aviso[]) {
  const prev = cache.avisos;
  cache.avisos = lista;
  notificar();
  sincronizar("avisos", prev, lista, (a) => ({
    id: a.id,
    titulo: a.titulo,
    texto: a.texto,
    data: a.data,
    destaque: a.destaque,
  }));
}

export const getPontos = () => cache.pontos;
export function setPontos(mapa: Record<string, number>) {
  const prev = cache.pontos;
  cache.pontos = { ...mapa };
  notificar();
  for (const [id, valor] of Object.entries(mapa)) {
    if (prev[id] === valor) continue;
    void db.from("profiles").update({ pontos: valor }).eq("id", id).then(erro("pontos"));
  }
}

export const getConfig = (): ConfigGamificacao => cache.config;
export function setConfig(c: ConfigGamificacao) {
  cache.config = c;
  notificar();
  void db
    .from("config")
    .upsert({ id: "gamificacao", dados: c, atualizado_em: new Date().toISOString() })
    .then(erro("config"));
}

export const getConfigDias = (): ConfigDias => cache.configDias;
export function setConfigDias(c: ConfigDias) {
  cache.configDias = c;
  notificar();
  void db
    .from("config")
    .upsert({ id: "dias", dados: c, atualizado_em: new Date().toISOString() })
    .then(erro("configDias"));
}

export const getSessao = (): Sessao => cache.sessao;
export const getAdmin = (): Admin => ({ usuario: "admin", senha: "" });

// Compatibilidade com a versão anterior (localStorage)
export const finishHydration = () => {};
export const seed = () => {};
